import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { watchSessionExpiry } from '@/features/auth/session-expiry';
import { createQueryClient } from './query-client';
import { createAppRouter } from './router';

export function renderApp(rootElement: HTMLElement) {
  const queryClient = createQueryClient();
  const router = createAppRouter(queryClient);
  watchSessionExpiry(queryClient, router);

  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
}
