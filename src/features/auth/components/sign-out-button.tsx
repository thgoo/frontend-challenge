import { useNavigate } from '@tanstack/react-router';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLogout } from '../queries';

export function SignOutButton() {
  const logout = useLogout();
  const navigate = useNavigate();
  return (
    <Button
      variant="outline"
      disabled={logout.isPending}
      onClick={() => {
        logout.mutate(undefined, { onSuccess: () => void navigate({ to: '/' }) });
      }}
    >
      <LogOut aria-hidden="true" />
      Sair da conta
    </Button>
  );
}
