import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createAppRouter } from '@/app/router';
import { createQueryClient } from '@/app/query-client';
import { env } from '@/config/env';
import './styles.css';

async function bootstrap() {
  if (env.enableMocks) {
    const { startMocking } = await import('@/mocks/browser');
    await startMocking();
  }

  const queryClient = createQueryClient();
  const router = createAppRouter(queryClient);
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('Root element #root not found');

  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
}

void bootstrap();
