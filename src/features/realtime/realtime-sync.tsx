import { toast } from 'sonner';
import { useCurrentUserId } from '@/features/auth/use-current-user-id';
import { useRealtimeSync } from './use-realtime-sync';

/** Lazily loaded after the first render, so socket.io-client stays out of the app chunk. */
export default function RealtimeSync() {
  useRealtimeSync(useCurrentUserId(), {
    onCartLineChanged: (line) => {
      toast.info(
        `“${line.nftName}” mudou de preço ou disponibilidade. Seu carrinho foi atualizado.`,
      );
    },
  });
  return null;
}
