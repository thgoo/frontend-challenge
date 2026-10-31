import { useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router';
import { ChevronLeftIcon } from '@/components/icons';

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
      <ChevronLeftIcon className="size-5" />
    </button>
  );
}
