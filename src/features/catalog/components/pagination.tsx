import { Link } from '@tanstack/react-router';
import { cn } from 'cn';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_CLASS =
  'grid size-[35px] place-items-center rounded border border-border text-lg leading-4 hover:border-primary';

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav aria-label="Paginação" className="flex flex-wrap items-center justify-end gap-2">
      {page > 1 && (
        <Link
          from="/"
          to="/"
          search={(prev) => ({ ...prev, page: page - 1 })}
          hash="mercado"
          aria-label="Página anterior"
          className={PAGE_CLASS}
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
        </Link>
      )}
      {pages.map((number) => (
        <Link
          key={number}
          from="/"
          to="/"
          search={(prev) => ({ ...prev, page: number })}
          hash="mercado"
          aria-current={number === page ? 'page' : undefined}
          aria-label={`Página ${String(number)}`}
          className={cn(
            PAGE_CLASS,
            number === page && 'border-primary bg-primary font-bold text-primary-foreground',
          )}
        >
          {number}
        </Link>
      ))}
      {page < totalPages && (
        <Link
          from="/"
          to="/"
          search={(prev) => ({ ...prev, page: page + 1 })}
          hash="mercado"
          aria-label="Próxima página"
          className={PAGE_CLASS}
        >
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      )}
    </nav>
  );
}
