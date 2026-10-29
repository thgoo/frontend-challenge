import { setupWorker } from 'msw/browser';
import { initControl, mockControl } from './control';
import { handlers } from './handlers';
import { createSocketHandler } from './realtime/socket-server';

export async function startMocking() {
  await initControl();
  const worker = setupWorker(...handlers, createSocketHandler());
  await worker.start({ onUnhandledRequest: 'bypass', quiet: import.meta.env.PROD });
  // Published last so its presence signals that the mock layer is ready.
  window.__mocks = mockControl;
}
