import type { RequestHandler, WebSocketHandler } from 'msw';

export const handlers: (RequestHandler | WebSocketHandler)[] = [];
