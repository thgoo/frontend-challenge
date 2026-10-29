import { toSocketIo } from '@mswjs/socket.io-binding';
import { ws, type WebSocketHandlerConnection } from 'msw';
import { SOCKET_PATH } from '@/contracts/events';
import { readDocumentCookie, SESSION_COOKIE } from '../http/cookies';
import { findActiveSession } from '../http/session';
import { currentScenario } from '../runtime';
import { subscribe, type Delivery } from './event-bus';

/** Matches the `pingInterval` the binding announces; without pings the client drops the connection. */
const HEARTBEAT_MS = 25_000;
const ENGINE_IO_PING = '2';
const HISTORY_LIMIT = 200;

interface ClientConnection {
  sessionToken: string | undefined;
  emit(event: string, payload: unknown): void;
  close(): void;
}

const connections = new Set<ClientConnection>();
const history: Delivery[] = [];
let online = true;

function socketUrlPattern() {
  const origin = window.location.origin.replace(/^http/, 'ws');
  return `${origin}${SOCKET_PATH}/`;
}

/** Re-checked per delivery, so a logout or expiry silences private events on a still-open socket. */
function canReceive(connection: ClientConnection, { recipientUserId }: Delivery) {
  return (
    recipientUserId === null ||
    findActiveSession(connection.sessionToken)?.userId === recipientUserId
  );
}

function deliver(delivery: Delivery) {
  for (const connection of connections) {
    if (canReceive(connection, delivery)) connection.emit(delivery.event.type, delivery.event);
  }
}

/**
 * A refused connection fires `error` before `close` in real browsers. Socket.IO only schedules
 * the next reconnection attempt on `error`; a bare close would stall it until its 20s timeout.
 */
function refuse(client: WebSocketHandlerConnection['client']) {
  if ('socket' in client && client.socket instanceof EventTarget) {
    client.socket.dispatchEvent(new Event('error'));
  }
  client.close();
}

function accept(socket: WebSocketHandlerConnection) {
  const { client } = socket;
  if (!online || currentScenario().offline) {
    refuse(client);
    return;
  }

  const io = toSocketIo(socket);
  const heartbeat = setInterval(() => {
    client.send(ENGINE_IO_PING);
  }, HEARTBEAT_MS);
  const connection: ClientConnection = {
    sessionToken: readDocumentCookie(SESSION_COOKIE),
    emit: (event, payload) => {
      io.client.emit(event, payload);
    },
    close: () => {
      client.close();
    },
  };

  connections.add(connection);
  client.addEventListener('close', () => {
    clearInterval(heartbeat);
    connections.delete(connection);
  });
}

export function createSocketHandler() {
  subscribe((delivery) => {
    history.push(delivery);
    if (history.length > HISTORY_LIMIT) history.shift();
    deliver(delivery);
  });
  return ws.link(socketUrlPattern()).addEventListener('connection', accept);
}

export const socketControl = {
  deliveredEvents() {
    return history.map(({ event }) => ({
      eventId: event.eventId,
      type: event.type,
      resourceId: event.resource.id,
      version: event.version,
    }));
  },
  redeliver(eventId: string) {
    const delivery = history.find(({ event }) => event.eventId === eventId);
    if (!delivery) throw new Error(`Unknown event "${eventId}"`);
    deliver(delivery);
  },
  disconnect() {
    connections.forEach((connection) => {
      connection.close();
    });
  },
  setOnline(value: boolean) {
    online = value;
    if (!value) socketControl.disconnect();
  },
};
