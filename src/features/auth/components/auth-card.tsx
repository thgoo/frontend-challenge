import { Link, useCanGoBack, useRouter } from '@tanstack/react-router';
import { cn } from 'cn';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import type { AuthSearch } from '../auth-search';

type AuthMode = 'login' | 'register';

const SOCIAL_PROVIDERS = ['Google', 'Facebook'] as const;

function SocialButtons() {
  return (
    <div className="grid gap-3">
      <p className="flex items-center gap-3 text-sm before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
        Ou continue com
      </p>
      {SOCIAL_PROVIDERS.map((provider) => (
        <button
          key={provider}
          type="button"
          onClick={() => {
            toast.info(`Entrar com ${provider} não está disponível nesta demonstração.`);
          }}
          className="flex h-10 items-center justify-center gap-2 rounded-sm border border-border text-sm font-medium hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <img src={`/icons/${provider.toLowerCase()}.svg`} alt="" width={20} height={20} />
          Continuar com {provider}
        </button>
      ))}
    </div>
  );
}

function CloseButton() {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const close = () => {
    if (canGoBack) router.history.back();
    else void router.navigate({ to: '/' });
  };
  return (
    <button
      type="button"
      aria-label="Fechar"
      onClick={close}
      className="absolute top-4 right-4 hidden size-8 place-items-center rounded text-primary hover:bg-accent lg:grid"
    >
      <X aria-hidden="true" className="size-5" />
    </button>
  );
}

interface AuthCardProps {
  mode: AuthMode;
  search: AuthSearch;
  subtitle: string;
  notice?: ReactNode;
  children: ReactNode;
}

/** Full screen on mobile; on desktop the modal card of the Figma, as its own route. */
export function AuthCard({ mode, search, subtitle, notice, children }: AuthCardProps) {
  const title = mode === 'login' ? 'Entrar' : 'Criar conta';
  const tabClass = (active: boolean) =>
    cn('px-2', active ? 'text-highlight' : 'text-foreground hover:text-highlight');

  return (
    <div className="grid min-h-[calc(100dvh-4rem)] place-items-center px-6 py-12 lg:min-h-0 lg:py-16">
      <section className="relative grid w-full max-w-[500px] gap-6 lg:border-b-[10px] lg:border-primary lg:bg-card lg:px-20 lg:pt-14 lg:pb-12">
        <CloseButton />
        <Link
          to="/"
          aria-label="Kurio, voltar ao início"
          className="justify-self-center text-3xl font-bold tracking-wide lg:hidden"
        >
          KURIO
        </Link>
        <h1 className="text-center text-xl font-bold lg:sr-only">{title}</h1>
        <nav aria-label="Acesso" className="hidden justify-center text-xl lg:flex">
          <Link
            to="/login"
            search={search}
            aria-current={mode === 'login' ? 'page' : undefined}
            className={cn(tabClass(mode === 'login'), 'border-r border-primary')}
          >
            Entrar
          </Link>
          <Link
            to="/register"
            search={search}
            aria-current={mode === 'register' ? 'page' : undefined}
            className={tabClass(mode === 'register')}
          >
            Criar conta
          </Link>
        </nav>
        <p className="hidden text-center text-sm lg:block">{subtitle}</p>
        {notice}
        {children}
        <SocialButtons />
        <p className="text-center text-[15px] text-muted-foreground lg:hidden">
          {mode === 'login' ? (
            <Link to="/register" search={search} className="hover:text-highlight">
              Novo na Kurio? Crie uma conta
            </Link>
          ) : (
            <Link to="/login" search={search} className="hover:text-highlight">
              Já tem uma conta? Entrar
            </Link>
          )}
        </p>
      </section>
    </div>
  );
}
