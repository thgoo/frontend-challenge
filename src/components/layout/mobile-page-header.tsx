import { useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router';
import { ChevronLeft } from 'lucide-react';

export function BackButton({ fallback = '/' }: { fallback?: string }) {
  const router = useRouter();
  const navigate = useNavigate();
  const canGoBack = useCanGoBack();
  return (
    <button
      type="button"
      aria-label="Voltar"
      onClick={() => {
        if (canGoBack) router.history.back();
        else void navigate({ to: fallback });
      }}
      className="grid size-[35px] place-items-center rounded-full border border-border bg-muted text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <ChevronLeft aria-hidden="true" className="size-5" />
    </button>
  );
}

/**
 * Mobile screens without the tab bar open with a back button and a centered title. Desktop
 * relies on the breadcrumb, so the title stays only for assistive technology there.
 */
export function MobilePageHeader({ title }: { title: string }) {
  return (
    <header className="grid grid-cols-[2.25rem_1fr_2.25rem] items-center gap-2 lg:block">
      <span className="lg:hidden">
        <BackButton />
      </span>
      <h1 className="text-center text-xl font-bold lg:sr-only">{title}</h1>
    </header>
  );
}
