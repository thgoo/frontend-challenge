import { Link, useNavigate } from '@tanstack/react-router';
import { Menu, ShoppingCart, Store } from 'lucide-react';
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useLogout, useSession } from '@/features/auth/queries';
import { useCart } from '@/features/cart/queries';

function CartLink() {
  const { data: cart } = useCart();
  const count = cart?.lines.reduce((total, line) => total + line.quantity, 0) ?? 0;
  return (
    <Button asChild variant="ghost" size="icon" className="relative">
      <Link to="/cart" aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}>
        <ShoppingCart aria-hidden="true" />
        {count > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-primary text-xs"
          >
            {count}
          </span>
        )}
      </Link>
    </Button>
  );
}

function UserMenu() {
  const session = useSession();
  const logout = useLogout();
  const navigate = useNavigate();

  if (!session) {
    return (
      <div className="hidden items-center gap-2 sm:flex">
        <Button asChild variant="ghost">
          <Link to="/login">Sign in</Link>
        </Button>
        <Button asChild>
          <Link to="/register">Sign up</Link>
        </Button>
      </div>
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
          aria-label={`Account menu for ${user.name}`}
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
          <Link to="/profile">Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/wallets">Wallets</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            logout.mutate(undefined, { onSuccess: () => void navigate({ to: '/' }) });
          }}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileMenu() {
  const session = useSession();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Open menu">
          <Menu aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav aria-label="Mobile" className="grid gap-2 px-4">
          <Link to="/">Marketplace</Link>
          <Link to="/cart">Cart</Link>
          {session ? (
            <>
              <Link to="/profile">Profile</Link>
              <Link to="/wallets">Wallets</Link>
            </>
          ) : (
            <>
              <Link to="/login">Sign in</Link>
              <Link to="/register">Sign up</Link>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold">
          <Store aria-hidden="true" className="text-primary" />
          NFT Marketplace
        </Link>
        <nav aria-label="Main" className="flex items-center gap-2">
          <Link to="/" className="hidden px-3 sm:inline">
            Marketplace
          </Link>
          <CartLink />
          <UserMenu />
          <MobileMenu />
        </nav>
      </div>
    </header>
  );
}
