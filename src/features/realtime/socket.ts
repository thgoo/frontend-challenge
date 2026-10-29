import { io, type Socket } from 'socket.io-client';
import { SOCKET_PATH, type SOCKET_EVENTS } from '@/contracts/events';

/** Payloads are typed as unknown on purpose: they are validated against the contracts on arrival. */
interface ServerToClientEvents {
  [SOCKET_EVENTS.nftUpdated]: (payload: unknown) => void;
  [SOCKET_EVENTS.orderUpdated]: (payload: unknown) => void;
}

export type RealtimeSocket = Socket<ServerToClientEvents>;

export function createSocket(): RealtimeSocket {
  return io({
    path: SOCKET_PATH,
    transports: ['websocket'],
    autoConnect: false,
    withCredentials: true,
  });
}
