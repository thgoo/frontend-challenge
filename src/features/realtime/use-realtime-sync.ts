import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import type { Cart, CartLine } from '@/contracts/cart';
import { nftUpdatedEventSchema, orderUpdatedEventSchema, SOCKET_EVENTS } from '@/contracts/events';
import { cartKey } from '@/features/cart/queries';
import { applyNftUpdated, applyOrderUpdated } from './cache-sync';
import { createEventGate } from './event-gate';
import { createSocket } from './socket';

interface RealtimeCallbacks {
  onCartLineChanged?: (line: CartLine) => void;
}

/**
 * One socket per session: a user change tears it down and reconnects with the new cookie, so
 * events of a previous session can never reach the next user's cache.
 */
export function useRealtimeSync(userId: string | null, callbacks: RealtimeCallbacks = {}) {
  const queryClient = useQueryClient();
  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    const socket = createSocket();
    const gate = createEventGate();
    let hasConnected = false;

    socket.on('connect', () => {
      if (hasConnected) void queryClient.invalidateQueries({ refetchType: 'active' });
      hasConnected = true;
    });

    socket.on(SOCKET_EVENTS.nftUpdated, (payload) => {
      const event = nftUpdatedEventSchema.safeParse(payload);
      if (!event.success || !gate.accept(event.data)) return;
      applyNftUpdated(queryClient, userId, event.data);

      const key = cartKey(userId);
      const line = queryClient
        .getQueryData<Cart>(key)
        ?.lines.find((item) => item.nftId === event.data.resource.id);
      if (!line) return;
      void queryClient.invalidateQueries({ queryKey: key });
      callbacksRef.current.onCartLineChanged?.(line);
    });

    socket.on(SOCKET_EVENTS.orderUpdated, (payload) => {
      const event = orderUpdatedEventSchema.safeParse(payload);
      if (!userId || !event.success || !gate.accept(event.data)) return;
      applyOrderUpdated(queryClient, userId, event.data);
      if (event.data.data.status === 'confirmed')
        void queryClient.invalidateQueries({ queryKey: cartKey(userId) });
    });

    socket.connect();
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [queryClient, userId]);
}
