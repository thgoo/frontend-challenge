import { Link } from '@tanstack/react-router';
import { HeartLineIcon, LocationIcon, LogoutIcon, ProfileIcon } from '@/components/icons';
import type { ReactNode } from 'react';
import { useSignOut } from '@/features/auth/use-sign-out';

const ITEMS = [
  { to: '/profile', label: 'Dados do perfil', Icon: ProfileIcon },
  { to: '/wallets', label: 'Carteiras', Icon: LocationIcon },
  { to: '/favorites', label: 'Lista de interesse', Icon: HeartLineIcon },
] as const;

const ITEM_CLASS =
  'flex items-center gap-3 border-b-2 border-transparent px-4 py-3 text-[15px] whitespace-nowrap text-highlight hover:bg-accent data-[status=active]:border-primary lg:border-b-0 lg:border-l-[6px]';

/** "Meu perfil" sidebar from the Figma; only entries backed by a page are listed. */
export function AccountLayout({ children }: { children: ReactNode }) {
  const { pending, signOut } = useSignOut();
  return (
    <div className="page-container grid grid-cols-1 gap-7 pt-6 pb-10 lg:grid-cols-[310px_minmax(0,1fr)] lg:pt-8 lg:pb-0">
      <nav aria-label="Meu perfil" className="content-start self-start bg-card lg:grid lg:py-4">
        <p className="hidden px-2.5 pb-2 text-lg font-bold lg:block">Meu perfil</p>
        <ul className="flex overflow-x-auto lg:grid">
          {ITEMS.map(({ to, label, Icon }) => (
            <li key={to}>
              <Link to={to} className={ITEM_CLASS}>
                <Icon aria-hidden="true" className="size-5" />
                {label}
              </Link>
            </li>
          ))}
          <li className="lg:border-t lg:border-border">
            <button
              type="button"
              disabled={pending}
              onClick={() => void signOut()}
              className={`${ITEM_CLASS} w-full font-bold disabled:opacity-50`}
            >
              <LogoutIcon className="size-5" />
              Sair
            </button>
          </li>
        </ul>
      </nav>
      <div className="grid content-start gap-8">{children}</div>
    </div>
  );
}
