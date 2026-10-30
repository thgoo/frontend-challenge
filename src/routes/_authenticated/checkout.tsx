import { createFileRoute } from '@tanstack/react-router';
import { MobilePageHeader } from '@/components/layout/mobile-page-header';
import { CheckoutPage } from '@/features/checkout/components/checkout-page';
import { MarketplaceBreadcrumb } from '@/components/layout/breadcrumb';

export const Route = createFileRoute('/_authenticated/checkout')({
  staticData: { hideMobileTabBar: true },
  head: () => ({ meta: [{ title: 'Pagamento · Kurio' }] }),
  component: () => (
    <div className="page-container grid grid-cols-1 gap-6 pt-6 pb-10 lg:gap-8 lg:pt-8 lg:pb-0">
      <MobilePageHeader title="Pagamento com carteira" />
      <MarketplaceBreadcrumb current="Pagamento" />
      <CheckoutPage />
    </div>
  ),
});
