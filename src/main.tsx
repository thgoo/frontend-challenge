import { env } from '@/config/env';
import './styles.css';

/**
 * The app is loaded only after the mocks start: engine.io-client captures `globalThis.WebSocket`
 * when evaluated, which would bypass MSW's interception. The realtime layer is additionally
 * lazy-loaded after the first render (see RealtimeSync), keeping the app chunk smaller.
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
