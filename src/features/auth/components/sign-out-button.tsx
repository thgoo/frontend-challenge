import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSignOut } from '../use-sign-out';

export function SignOutButton() {
  const { pending, signOut } = useSignOut();
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() => {
        void signOut();
      }}
    >
      <LogOut aria-hidden="true" />
      Sair da conta
    </Button>
  );
}
