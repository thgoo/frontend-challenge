import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/wallets')({
  component: () => <h1 className="px-4 py-8 text-3xl font-semibold">Wallets</h1>,
});
