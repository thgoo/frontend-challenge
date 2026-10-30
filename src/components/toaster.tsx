import { Toaster as Sonner } from 'sonner';

/** Top placement keeps toasts off the mobile tab bar and the fixed purchase actions. */
export function Toaster() {
  return <Sonner theme="dark" position="top-center" richColors closeButton />;
}
