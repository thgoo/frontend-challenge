import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/cart')({
  component: () => <h1 className="px-4 py-8 text-3xl font-semibold">Cart</h1>,
});
