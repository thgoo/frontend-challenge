import { Link } from '@tanstack/react-router';
import { cn } from 'cn';
import { buttonVariants } from '@/components/ui/button';

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-2">
      <Link
        from="/"
        to="/"
        search={(prev) => ({ ...prev, page: page - 1 })}
        disabled={page <= 1}
        className={cn(
          buttonVariants({ variant: 'outline' }),
          page <= 1 && 'pointer-events-none opacity-50',
        )}
      >
        Previous
      </Link>
      {pages.map((number) => (
        <Link
          key={number}
          from="/"
          to="/"
          search={(prev) => ({ ...prev, page: number })}
          aria-current={number === page ? 'page' : undefined}
          aria-label={`Page ${number}`}
          className={buttonVariants({
            variant: number === page ? 'default' : 'ghost',
            size: 'icon',
          })}
        >
          {number}
        </Link>
      ))}
      <Link
        from="/"
        to="/"
        search={(prev) => ({ ...prev, page: page + 1 })}
        disabled={page >= totalPages}
        className={cn(
          buttonVariants({ variant: 'outline' }),
          page >= totalPages && 'pointer-events-none opacity-50',
        )}
      >
        Next
      </Link>
    </nav>
  );
}
