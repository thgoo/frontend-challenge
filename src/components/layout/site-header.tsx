import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { cn } from 'cn';
import { LogIn, ShoppingCart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLogout, useSession } from '@/features/auth/queries';
import { useCartItemCount } from '@/features/cart/queries';
import { cartLabel } from './cart-count';
import { SearchDialog } from './search-dialog';

const COMMERCE_PATHS = /^\/(nfts|cart|checkout|orders)\b/;

const NAV_ITEMS = [
  { label: 'Início', hash: undefined, isActive: (path: string) => path === '/' },
  { label: 'Mercado', hash: 'mercado', isActive: (path: string) => COMMERCE_PATHS.test(path) },
  { label: 'Criadores', hash: 'criadores', isActive: () => false },
  { label: 'Aprenda', hash: 'aprenda', isActive: () => false },
] as const;

export function CartBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span
      aria-hidden="true"
      className="absolute -top-1.5 -right-2 grid size-4 place-items-center rounded-full border-2 border-background bg-primary text-[10px] font-medium text-primary-foreground"
    >
      {count}
    </span>
  );
}

function CartLink() {
  const count = useCartItemCount();
  return (
    <Link to="/cart" aria-label={cartLabel(count)} className="relative rounded-md p-1">
      <ShoppingCart aria-hidden="true" className="size-6" />
      <CartBadge count={count} />
    </Link>
  );
}

function AccountMenu() {
  const session = useSession();
  const logout = useLogout();
  const navigate = useNavigate();

  if (!session) {
    return (
      <Button asChild className="h-[35px] px-3 text-base font-medium">
        <Link to="/login">
          <LogIn aria-hidden="true" className="size-5" />
          Entrar
        </Link>
      </Button>
    );
  }

  const { user } = session;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label={`Menu da conta de ${user.name}`}
        >
          <Avatar>
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
            <AvatarFallback>{user.name.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile">Perfil</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/wallets">Carteiras</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/favorites">Favoritos</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            logout.mutate(undefined, { onSuccess: () => void navigate({ to: '/' }) });
          }}
        >
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Desktop only: below `lg` the Figma swaps the header for the mobile tab bar. */
export function SiteHeader() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <header className="page-container hidden pt-6 lg:block">
      <div className="flex items-start justify-between border-b border-primary/30">
        <Link to="/" className="w-40 pt-2 text-sm font-bold tracking-wide">
          KURIO
        </Link>
        <nav aria-label="Principal">
          <ul className="flex gap-10">
            {NAV_ITEMS.map((item) => {
              const active = item.isActive(pathname);
              return (
                <li key={item.label}>
                  <Link
                    to="/"
                    hash={item.hash}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'block border-b-[3px] pb-6 text-base',
                      active
                        ? 'border-primary font-bold text-highlight'
                        : 'border-transparent hover:text-highlight',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="flex w-40 items-center justify-end gap-7 xl:w-auto">
          <SearchDialog />
          <CartLink />
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
