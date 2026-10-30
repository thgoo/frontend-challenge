import { Link } from '@tanstack/react-router';
import { Fragment } from 'react';

/** Desktop trail under the header; every page in it lives under the marketplace. */
export function MarketplaceBreadcrumb({ current }: { current?: string }) {
  const items = [
    { label: 'Início', hash: undefined },
    { label: 'Mercado', hash: 'mercado' },
  ];
  return (
    <nav aria-label="Trilha" className="hidden text-[15px] font-bold lg:block">
      <ol className="flex gap-2">
        {items.map((item, index) => (
          <Fragment key={item.label}>
            {index > 0 && <li aria-hidden="true">/</li>}
            <li>
              <Link to="/" hash={item.hash} className="hover:text-highlight">
                {item.label}
              </Link>
            </li>
          </Fragment>
        ))}
        {current && (
          <>
            <li aria-hidden="true">/</li>
            <li aria-current="page">{current}</li>
          </>
        )}
      </ol>
    </nav>
  );
}
