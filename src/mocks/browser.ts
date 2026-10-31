import { focusManager } from '@tanstack/react-query';
import { setupWorker } from 'msw/browser';
import { initControl, mockControl } from './control';
import { handlers } from './handlers';
import { createSocketHandler } from './realtime/socket-server';

const REACTIVATION_TIMEOUT_MS = 1000;

export async function startMocking() {
  await initControl();
  const worker = setupWorker(...handlers, createSocketHandler());
  await worker.start({ onUnhandledRequest: 'bypass', quiet: import.meta.env.PROD });
  refetchOnReturnAfterReactivation();
  // Published last so its presence signals that the mock layer is ready.
  window.__mocks = mockControl;
}

/**
 * Browsers stop idle service workers (background tabs throttle MSW's keepalive), and the restarted
 * worker forgets which tabs enabled mocking, so every API call falls through to the network until
 * a reload. Returning to the tab re-activates mocking before queries refetch on focus.
 */
function refetchOnReturnAfterReactivation() {
  focusManager.setEventListener((handleFocus) => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleFocus(false);
        return;
      }
      void reactivateMocking().then(() => {
        handleFocus(true);
      });
    };
    window.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('visibilitychange', onVisibilityChange);
    };
  });
}

/** Resolves once the worker confirms this tab is a mocking client again (idempotent). */
function reactivateMocking() {
  const controller = navigator.serviceWorker.controller;
  if (!controller) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const done = () => {
      clearTimeout(timeout);
      navigator.serviceWorker.removeEventListener('message', onMessage);
      resolve();
    };
    const onMessage = (event: MessageEvent<{ type?: string } | null>) => {
      if (event.data?.type === 'MOCKING_ENABLED') done();
    };
    const timeout = setTimeout(done, REACTIVATION_TIMEOUT_MS);
    navigator.serviceWorker.addEventListener('message', onMessage);
    controller.postMessage('MOCK_ACTIVATE');
  });
}
