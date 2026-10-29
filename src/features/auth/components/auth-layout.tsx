import type { ReactNode } from 'react';

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <section className="mx-auto grid w-full max-w-md gap-6 px-4 py-12 sm:py-20">
      <header className="grid gap-2">
        <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </header>
      {children}
      <p className="text-sm text-muted-foreground">{footer}</p>
    </section>
  );
}
