import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { cn } from 'cn';
import { X } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogOverlay, DialogPortal } from '@/components/ui/dialog';
import { withAuthDialog, withoutAuthDialog, type AuthMode } from '../auth-search';
import { useSession } from '../queries';
import { safeRedirect } from '../safe-redirect';
import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';

const SOCIAL_PROVIDERS = ['Google', 'Facebook'] as const;

const COPY = {
  login: {
    title: 'Entrar',
    mobileTitle: 'Entrar',
    subtitle: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
  },
  register: {
    title: 'Criar conta',
    mobileTitle: 'Criar perfil de colecionador',
    subtitle: 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
  },
} satisfies Record<AuthMode, { title: string; mobileTitle: string; subtitle: string }>;

function SocialButtons() {
  return (
    <div className="grid gap-3">
      <p className="flex items-center gap-3 text-sm before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border lg:-mx-20">
        Ou continue com
      </p>
      {SOCIAL_PROVIDERS.map((provider) => (
        <button
          key={provider}
          type="button"
          onClick={() => {
            toast.info(`Entrar com ${provider} não está disponível nesta demonstração.`);
          }}
          className="flex h-10 items-center justify-center gap-2 rounded-sm border border-border text-[13px] font-medium text-muted-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <img src={`/icons/${provider.toLowerCase()}.svg`} alt="" width={20} height={20} />
          Continuar com {provider}
        </button>
      ))}
    </div>
  );
}

function ModeLink({
  mode,
  className,
  children,
}: {
  mode: AuthMode;
  className?: string;
  children: string;
}) {
  return (
    <Link to="." search={withAuthDialog(mode)} replace resetScroll={false} className={className}>
      {children}
    </Link>
  );
}

/**
 * Sign in and sign up over the current page, driven by `?auth=`: a modal card on desktop and a full
 * screen on mobile, as in the Figma. Closing keeps the page and its scroll position.
 */
export default function AuthDialog() {
  const search = useSearch({ from: '__root__' });
  const session = useSession();
  const navigate = useNavigate();
  const mode = search.auth;
  if (!mode || session) return null;

  const close = () => {
    void navigate({ to: '.', search: withoutAuthDialog, replace: true, resetScroll: false });
  };
  const complete = () => {
    if (search.redirect) void navigate({ href: safeRedirect(search.redirect), replace: true });
    else close();
  };
  const tabClass = (active: boolean) =>
    cn('px-2 font-medium', active ? 'text-highlight' : 'text-foreground hover:text-highlight');

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogPortal>
        {/* The Figma shows the live page behind the card, without a dimmed backdrop. */}
        <DialogOverlay className="bg-transparent" />
        <DialogPrimitive.Content
          // Start in the first field (the close button comes first in the DOM).
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            (event.currentTarget as HTMLElement | null)?.querySelector('input')?.focus();
          }}
          className="fixed inset-0 z-50 overflow-y-auto bg-background outline-none lg:inset-auto lg:top-1/2 lg:left-1/2 lg:max-h-[calc(100dvh-2rem)] lg:min-h-[600px] lg:w-[500px] lg:-translate-1/2 lg:border-b-[10px] lg:border-primary lg:bg-card"
        >
          <div className="grid min-h-full place-items-center px-6 py-12 lg:block lg:min-h-0 lg:px-20 lg:pt-14 lg:pb-12">
            <div className="grid w-full gap-6">
              <DialogPrimitive.Close
                aria-label="Fechar"
                className="absolute top-4 right-4 hidden size-8 place-items-center rounded text-primary hover:bg-accent lg:grid"
              >
                <X aria-hidden="true" className="size-5" />
              </DialogPrimitive.Close>
              <Link
                to="/"
                aria-label="Kurio, voltar ao início"
                className="justify-self-center text-[32px] font-bold tracking-[0.1em] lg:hidden"
              >
                KURIO
              </Link>
              <DialogPrimitive.Title className="text-center text-xl font-bold lg:sr-only">
                <span className="lg:hidden">{COPY[mode].mobileTitle}</span>
                <span className="max-lg:hidden">{COPY[mode].title}</span>
              </DialogPrimitive.Title>
              <nav aria-label="Acesso" className="hidden justify-center text-xl lg:flex">
                <ModeLink
                  mode="login"
                  className={cn(tabClass(mode === 'login'), 'border-r border-primary')}
                >
                  Entrar
                </ModeLink>
                <ModeLink mode="register" className={tabClass(mode === 'register')}>
                  Criar conta
                </ModeLink>
              </nav>
              <DialogPrimitive.Description className="hidden text-center text-[13px] lg:block">
                {COPY[mode].subtitle}
              </DialogPrimitive.Description>
              {mode === 'login' && search.reason === 'expired' && (
                <Alert role="status">
                  <AlertDescription>
                    Sua sessão expirou. Entre novamente para continuar de onde parou.
                  </AlertDescription>
                </Alert>
              )}
              {mode === 'login' ? (
                <LoginForm onSuccess={complete} />
              ) : (
                <RegisterForm onSuccess={complete} />
              )}
              <SocialButtons />
              <p className="text-center text-[15px] text-muted-foreground lg:hidden">
                {mode === 'login' ? (
                  <ModeLink mode="register" className="hover:text-highlight">
                    Novo na Kurio? Crie uma conta
                  </ModeLink>
                ) : (
                  <ModeLink mode="login" className="hover:text-highlight">
                    Já tem uma conta? Entre
                  </ModeLink>
                )}
              </p>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
