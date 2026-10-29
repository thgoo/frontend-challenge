import { env } from '@/config/env';

/**
 * The app is loaded only after the mocks start: libraries such as engine.io-client capture
 * `globalThis.WebSocket` at import time, which would bypass MSW's interception.
 */
async function bootstrap() {
  if (env.enableMocks) {
    const { startMocking } = await import('@/mocks/browser');
    await startMocking();
  }

  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('Root element #root not found');
  const { renderApp } = await import('@/app/render');
  renderApp(rootElement);
}

void bootstrap();
