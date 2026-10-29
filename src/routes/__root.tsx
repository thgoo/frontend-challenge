import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

export interface RouterContext {
  queryClient: QueryClient;
}

const Devtools = import.meta.env.DEV ? lazy(() => import('@/app/devtools')) : () => null;

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
});

function RootLayout() {
  return (
    <>
      <main id="main">
        <Outlet />
      </main>
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
