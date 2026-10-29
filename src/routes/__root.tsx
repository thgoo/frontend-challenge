import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, HeadContent, Link, Outlet } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { toast } from 'sonner';
import { SiteHeader } from '@/components/layout/site-header';
import { ErrorState } from '@/components/query-states';
import { Toaster } from '@/components/toaster';
import { sessionQueryOptions } from '@/features/auth/queries';
import { useCurrentUserId } from '@/features/auth/use-current-user-id';
import { useRealtimeSync } from '@/features/realtime/use-realtime-sync';

export interface RouterContext {
  queryClient: QueryClient;
}

const Devtools = import.meta.env.DEV ? lazy(() => import('@/app/devtools')) : () => null;

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ context }) => ({
    session: await context.queryClient.query({ ...sessionQueryOptions, staleTime: 'static' }),
  }),
  head: () => ({ meta: [{ title: 'NFT Marketplace' }] }),
  component: RootLayout,
  notFoundComponent: NotFound,
  errorComponent: ({ error, reset }) => <ErrorState error={error} onRetry={reset} />,
});

function RootLayout() {
  useRealtimeSync(useCurrentUserId(), {
    onCartLineChanged: (line) => {
      toast.info(`“${line.nftName}” changed price or availability. Your cart was updated.`);
    },
  });

  return (
    <>
      <HeadContent />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-primary focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <Outlet />
      </main>
      <Toaster />
      <Suspense>
        <Devtools />
      </Suspense>
    </>
  );
}

function NotFound() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-4xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">The page you are looking for does not exist.</p>
      <Link to="/" className="text-primary underline underline-offset-4">
        Back to home
      </Link>
    </section>
  );
}
