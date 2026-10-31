import { Link } from '@tanstack/react-router';
import { cn } from 'cn';
import { Loader2, X, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { EthAmount } from '@/components/eth-amount';
import { Button } from '@/components/ui/button';
import type { Order } from '@/contracts/order';
import { formatShortDate } from '@/i18n/locale';
import { EXPLORER_LABELS, NETWORK_LABELS } from '@/lib/networks';
import { shortenAddress } from '@/lib/wallets';
import { QuoteLines } from './quote-lines';

function SummaryBar({ order }: { order: Order }) {
  const items = [
    { label: 'ID da transação', value: order.txHash ? shortenAddress(order.txHash) : 'Pendente' },
    { label: 'Data', value: formatShortDate(order.createdAt) },
    { label: 'Total', value: <EthAmount value={order.receipt.totalEth} /> },
    { label: 'Carteira', value: shortenAddress(order.walletAddress) },
  ];
  return (
    <dl className="grid grid-cols-2 gap-y-3 border-y border-primary px-6 py-3 text-sm sm:grid-cols-[repeat(4,auto)] sm:justify-between sm:px-9">
      {items.map((item, index) => (
        <div
          key={item.label}
          className={cn('grid gap-0.5 px-3', index > 0 && 'sm:border-l sm:border-primary')}
        >
          <dt className="leading-4 font-bold whitespace-nowrap text-muted-foreground">
            {item.label}
          </dt>
          <dd className="text-[15px] leading-5 whitespace-nowrap text-muted-foreground">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function OrderCard({
  order,
  icon,
  title,
  status,
  children,
}: {
  order: Order;
  icon: ReactNode;
  title: string;
  status: 'status' | 'alert';
  children: ReactNode;
}) {
  const { receipt } = order;
  return (
    <article className="relative mx-auto w-full max-w-[578px] border-b-[10px] border-primary bg-card">
      <Link
        to="/"
        aria-label="Fechar e voltar ao início"
        className="absolute top-4 right-4 grid size-8 place-items-center rounded text-primary hover:bg-accent"
      >
        <X aria-hidden="true" className="size-5" />
      </Link>
      <header role={status} className="grid justify-items-center gap-4 px-6 pt-6 pb-5 text-center">
        {icon}
        <h1 className="text-base font-bold text-muted-foreground">{title}</h1>
      </header>
      <SummaryBar order={order} />
      <div className="grid gap-4 px-6 pt-6 pb-10 sm:px-11">
        <h2 className="text-[15px] font-bold">Detalhes da transação</h2>
        <QuoteLines lines={receipt.lines} variant="receipt" />
        <dl className="grid gap-2 border-b border-primary/30 pb-3 text-[15px]">
          <div className="flex justify-between gap-4">
            <dt>Taxa de rede</dt>
            <dd>
              <EthAmount value={receipt.networkFeeEth} />
            </dd>
          </div>
          <div className="flex justify-between gap-4 font-bold">
            <dt>Total</dt>
            <dd className="text-lg text-highlight">
              <EthAmount value={receipt.totalEth} />
            </dd>
          </div>
        </dl>
        {children}
      </div>
    </article>
  );
}

export function OrderStatus({ order }: { order: Order }) {
  const network = NETWORK_LABELS[order.receipt.network];
  switch (order.status) {
    case 'pending':
      return (
        <OrderCard
          order={order}
          status="status"
          title="Aguardando confirmação do pagamento"
          icon={
            <Loader2
              aria-hidden="true"
              className="size-16 animate-spin text-primary motion-reduce:animate-none"
            />
          }
        >
          <p className="text-center text-sm leading-6 text-muted-foreground">
            O pedido {order.id} foi enviado. Você pode atualizar a página ou voltar depois: esta
            tela se atualiza sozinha.
          </p>
        </OrderCard>
      );
    case 'declined':
      return (
        <OrderCard
          order={order}
          status="alert"
          title="Pagamento recusado"
          icon={<XCircle aria-hidden="true" className="size-16 text-error" />}
        >
          <p className="text-center text-sm leading-6 text-muted-foreground">
            A carteira recusou o pagamento. Seu carrinho foi mantido para você tentar novamente.
          </p>
          <Button asChild className="justify-self-center">
            <Link to="/checkout">Voltar ao pagamento</Link>
          </Button>
        </OrderCard>
      );
    case 'confirmed':
      return (
        <OrderCard
          order={order}
          status="status"
          title="Seus NFTs agora estão na sua carteira"
          icon={<img src="/icons/thank-you.svg" alt="" width={80} height={80} />}
        >
          <p className="text-center text-sm leading-6 text-muted-foreground">
            Transação confirmada na {network}. A propriedade foi transferida para sua carteira
            conectada e registrada na rede.
          </p>
          {order.explorerUrl && (
            <Button asChild className="h-12 justify-self-center px-4 text-base font-bold">
              <a href={order.explorerUrl} target="_blank" rel="noopener noreferrer">
                Ver no {EXPLORER_LABELS[order.receipt.network]}
                <span className="sr-only"> (transação simulada, abre em nova aba)</span>
              </a>
            </Button>
          )}
        </OrderCard>
      );
  }
}
