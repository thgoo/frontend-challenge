import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import type { Quote } from '@/contracts/quote';
import { errorMessage } from '@/i18n/api-errors';
import { hasErrorCode } from '@/lib/api-error';
import { checkoutDraft, type CheckoutDetails } from './checkout-details';
import { useConnectWallet, useWalletConnection, type usePlaceOrder } from './queries';
import { useIdempotencyKey } from './use-idempotency-key';

export interface CheckoutNotice {
  message: string;
  linkToCart?: boolean;
}

function noticeFor(error: unknown): CheckoutNotice {
  return {
    message: errorMessage(error),
    linkToCart: hasErrorCode(error, 'AVAILABILITY_CONFLICT', 'COUPON_EXPIRED', 'COUPON_INVALID'),
  };
}

interface CheckoutSubmitOptions {
  quote: Quote | undefined;
  /** False while the quote is stale or refreshing: confirming it would be rejected. */
  canConfirm: boolean;
  /** Owned by the page: the form may unmount (cart emptied by settlement) while the order is in flight. */
  placeOrder: ReturnType<typeof usePlaceOrder>;
  onQuoteOutdated: () => void;
}

/** Connects the selected wallet when needed, then places one order per quote. */
export function useCheckoutSubmit({
  quote,
  canConfirm,
  placeOrder,
  onQuoteOutdated,
}: CheckoutSubmitOptions) {
  const navigate = useNavigate();
  const connect = useConnectWallet();
  const { data: connection } = useWalletConnection();
  const idempotencyKey = useIdempotencyKey(quote?.id);
  const [notice, setNotice] = useState<CheckoutNotice | null>(null);

  async function submit({ walletId, network, ...buyer }: CheckoutDetails) {
    if (!quote || !canConfirm) return;
    setNotice(null);
    if (connection?.walletId !== walletId || connection.network !== network) {
      try {
        await connect.mutateAsync({ walletId, network });
      } catch (error) {
        setNotice(noticeFor(error));
        return;
      }
    }
    placeOrder.mutate(
      {
        input: {
          quoteId: quote.id,
          walletId,
          network,
          buyer: { ...buyer, note: buyer.note || undefined },
        },
        idempotencyKey,
      },
      {
        onSuccess: (order) => {
          checkoutDraft.clear();
          void navigate({ to: '/orders/$orderId', params: { orderId: order.id } });
        },
        onError: (error) => {
          if (hasErrorCode(error, 'QUOTE_OUTDATED')) {
            onQuoteOutdated();
            setNotice({
              message:
                'Preços ou disponibilidade mudaram. Revise o novo total e confirme novamente.',
            });
            return;
          }
          setNotice(noticeFor(error));
        },
      },
    );
  }

  return { submit, notice, placing: connect.isPending || placeOrder.isPending };
}
