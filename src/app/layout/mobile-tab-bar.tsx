import { Link } from '@tanstack/react-router';
import type { CSSProperties, ReactNode } from 'react';
import { HeartIcon, HomeIcon, ScanIcon, ShopIcon, UserIcon } from '@/components/icons';
import { withAuthDialog } from '@/features/auth/auth-search';
import { useSession } from '@/features/auth/queries';
import { useCartItemCount } from '@/features/cart/queries';
import { cartLabel } from './cart-count';
import { CartBadge } from './cart-badge';

const TAB_CLASS =
  'grid size-10 place-items-center text-muted-foreground data-[status=active]:text-highlight';

/** The Figma bar shape around the center action; the straight sides stretch with the screen. */
const NOTCH_PATH =
  'M151.7 0C137.94 0 125.72 8.2 119.87 20.65C112.11 37.17 95.31 48.62 75.85 48.62C56.39 48.62 39.59 37.18 31.83 20.65C25.98 8.2 13.75 0 0 0V94.95H151.7Z';

/** Icon centers relative to the bar center, as in the 414px Figma frame; narrower screens scale them in. */
function at(offset: number): CSSProperties {
  return { left: `calc(50% + min(1px, 100vw / 414) * ${String(offset)})` };
}

function Tab({ to, label, children }: { to: string; label: string; children: ReactNode }) {
  return (
    <Link to={to} aria-label={label} className={TAB_CLASS} activeOptions={{ exact: to === '/' }}>
      {children}
    </Link>
  );
}

function BarShape() {
  return (
    <div aria-hidden="true" className="absolute inset-0 flex">
      <div className="flex-1 rounded-tl-[29px] bg-card" />
      <svg viewBox="0 0 151.7 94.95" className="-mx-px h-full w-[152px] shrink-0 fill-card">
        <path d={NOTCH_PATH} />
      </svg>
      <div className="flex-1 rounded-tr-[29px] bg-card" />
    </div>
  );
}

/** Mobile and tablet navigation from the Figma; the raised center action opens the wallets. */
export function MobileTabBar() {
  const count = useCartItemCount();
  const session = useSession();
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 drop-shadow-[0_-10px_15px_rgb(10_6_4/0.45)] lg:hidden"
    >
      <div className="relative h-[95px]">
        <BarShape />
        <ul>
          <li className="absolute top-[30px] -translate-x-1/2" style={at(-161.5)}>
            <Tab to="/" label="Início">
              <HomeIcon />
            </Tab>
          </li>
          <li className="absolute top-[30px] -translate-x-1/2" style={at(-89.5)}>
            <Tab to="/favorites" label="Favoritos">
              <HeartIcon />
            </Tab>
          </li>
          <li className="absolute -top-[31px] -translate-x-1/2" style={at(0)}>
            <Link
              to="/wallets"
              aria-label="Carteiras"
              className="grid size-[65px] place-items-center rounded-full bg-linear-to-b from-primary/40 to-primary text-foreground"
            >
              <ScanIcon />
            </Link>
          </li>
          <li className="absolute top-[30px] -translate-x-1/2" style={at(94.5)}>
            <Tab to="/cart" label={cartLabel(count)}>
              <span className="relative">
                <ShopIcon />
                <CartBadge count={count} />
              </span>
            </Tab>
          </li>
          <li className="absolute top-[30px] -translate-x-1/2" style={at(156.5)}>
            {session ? (
              <Tab to="/profile" label={`Perfil de ${session.user.name}`}>
                <UserIcon />
              </Tab>
            ) : (
              <Link
                to="."
                search={withAuthDialog('login')}
                resetScroll={false}
                aria-label="Entrar"
                className={TAB_CLASS}
              >
                <UserIcon />
              </Link>
            )}
          </li>
        </ul>
      </div>
      <div className="h-[env(safe-area-inset-bottom)] bg-card" />
    </nav>
  );
}
