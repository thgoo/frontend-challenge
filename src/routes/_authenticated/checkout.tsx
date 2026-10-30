import { createFileRoute } from '@tanstack/react-router';
import { CheckoutPage } from '@/features/checkout/components/checkout-page';

export const Route = createFileRoute('/_authenticated/checkout')({
  staticData: { hideMobileTabBar: true },
  head: () => ({ meta: [{ title: 'Checkout · NFT Marketplace' }] }),
  component: () => (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-8">
      <h1 className="text-3xl font-semibold sm:text-5xl">Checkout</h1>
      <CheckoutPage />
    </div>
  ),
});
