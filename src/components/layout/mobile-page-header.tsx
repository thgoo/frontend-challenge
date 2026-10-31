import { BackButton } from './back-button';

/**
 * Mobile screens without the tab bar open with a back button and a centered title. Desktop
 * relies on the breadcrumb, so the title stays only for assistive technology there.
 */
export function MobilePageHeader({ title }: { title: string }) {
  return (
    <header className="grid grid-cols-[2.25rem_1fr_2.25rem] items-center gap-2 lg:block">
      <span className="lg:hidden">
        <BackButton />
      </span>
      <h1 className="text-center text-xl font-bold lg:sr-only">{title}</h1>
    </header>
  );
}
