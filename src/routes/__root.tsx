import type { QueryClient } from '@tanstack/react-query';
import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  Outlet,
  useMatches,
  useRouter,
  type ErrorComponentProps,
} from '@tanstack/react-router';
import { cn } from 'cn';
import { lazy, Suspense } from 'react';
import { toast } from 'sonner';
import { MobileTabBar } from '@/components/layout/mobile-tab-bar';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { ErrorState } from '@/components/query-states';
import { Toaster } from '@/components/toaster';
import { sessionQueryOptions } from '@/features/auth/queries';
import { useCurrentUserId } from '@/features/auth/use-current-user-id';
import { useRealtimeSync } from '@/features/realtime/use-realtime-sync';

export interface RouterContext {
  queryClient: QueryClient;
}

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    /** Mobile screens with their own bottom action bar hide the tab bar, as in the Figma. */
    hideMobileTabBar?: boolean;
  }
}

const Devtools = import.meta.env.DEV ? lazy(() => import('@/app/devtools')) : () => null;

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ context }) => ({
    session: await context.queryClient.query({ ...sessionQueryOptions, staleTime: 'static' }),
  }),
  head: () => ({ meta: [{ title: 'Kurio' }] }),
  component: RootLayout,
  notFoundComponent: NotFound,
  errorComponent: RootError,
});

function RootLayout() {
  const showTabBar = useMatches({
    select: (matches) => !matches.some((match) => match.staticData.hideMobileTabBar),
  });
  useRealtimeSync(useCurrentUserId(), {
    onCartLineChanged: (line) => {
      toast.info(
        `“${line.nftName}” mudou de preço ou disponibilidade. Seu carrinho foi atualizado.`,
      );
    },
  });

  return (
    <>
      <HeadContent />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className={cn('outline-none', showTabBar && 'pb-28 lg:pb-0')}>
        <Outlet />
      </main>
      <SiteFooter />
      {showTabBar && <MobileTabBar />}
      <Toaster />
      <Suspense>
        <Devtools />
      </Suspense>
    </>
  );
}

/** Invalidating re-runs `beforeLoad` and loaders; resetting the boundary alone would not. */
function RootError({ error }: ErrorComponentProps) {
  const router = useRouter();
  return <ErrorState error={error} onRetry={() => void router.invalidate()} />;
}

function NotFound() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-[28px] font-bold">Página não encontrada</h1>
      <p className="text-muted-foreground">A página que você procura não existe.</p>
      <Link to="/" className="text-highlight underline underline-offset-4">
        Voltar para o início
      </Link>
    </section>
  );
}
