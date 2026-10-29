import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createQueryClient } from './query-client';
import { createAppRouter } from './router';
import '../styles.css';

export function renderApp(rootElement: HTMLElement) {
  const queryClient = createQueryClient();
  const router = createAppRouter(queryClient);

  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
}
