import { Link } from '@tanstack/react-router';
import { Heart, Home, ScanLine, ShoppingCart, User } from 'lucide-react';
import type { ReactNode } from 'react';
import { withAuthDialog } from '@/features/auth/auth-search';
import { useSession } from '@/features/auth/queries';
import { useCartItemCount } from '@/features/cart/queries';
import { cartLabel } from './cart-count';
import { CartBadge } from './site-header';

const TAB_CLASS =
  'grid place-items-center p-2 text-muted-foreground data-[status=active]:text-primary';

function Tab({ to, label, children }: { to: string; label: string; children: ReactNode }) {
  return (
    <Link to={to} aria-label={label} className={TAB_CLASS} activeOptions={{ exact: to === '/' }}>
      {children}
    </Link>
  );
}

/** Mobile and tablet navigation from the Figma; the raised center action opens the wallets. */
export function MobileTabBar() {
  const count = useCartItemCount();
  const session = useSession();
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 rounded-t-[28px] bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto grid h-[72px] max-w-md grid-cols-5 items-center px-4">
        <li>
          <Tab to="/" label="Início">
            <Home aria-hidden="true" className="size-6" />
          </Tab>
        </li>
        <li>
          <Tab to="/favorites" label="Favoritos">
            <Heart aria-hidden="true" className="size-6" />
          </Tab>
        </li>
        <li className="grid place-items-center">
          <Link
            to="/wallets"
            aria-label="Carteiras"
            className="-mt-12 grid size-16 place-items-center rounded-full bg-linear-to-b from-primary/40 to-primary text-foreground shadow-lg"
          >
            <ScanLine aria-hidden="true" className="size-7" />
          </Link>
        </li>
        <li>
          <Tab to="/cart" label={cartLabel(count)}>
            <span className="relative">
              <ShoppingCart aria-hidden="true" className="size-6" />
              <CartBadge count={count} />
            </span>
          </Tab>
        </li>
        <li>
          {session ? (
            <Tab to="/profile" label={`Perfil de ${session.user.name}`}>
              <User aria-hidden="true" className="size-6" />
            </Tab>
          ) : (
            <Link
              to="."
              search={withAuthDialog('login')}
              resetScroll={false}
              aria-label="Entrar"
              className={TAB_CLASS}
            >
              <User aria-hidden="true" className="size-6" />
            </Link>
          )}
        </li>
      </ul>
    </nav>
  );
}
