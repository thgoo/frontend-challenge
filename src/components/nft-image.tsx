import { cn } from 'cn';
import type { NftImage as Image } from '@/contracts/nft';

const FORMATS = ['image/avif', 'image/webp'] as const;

interface NftImageProps {
  image: Image;
  /** Rendered width hints for the browser, e.g. `(min-width: 1024px) 250px, 45vw`. */
  sizes: string;
  /** Size and shape of the frame; the image always covers it. */
  className?: string;
  /** Decorative uses (the name is already next to it) pass an empty alt. */
  alt?: string;
  priority?: boolean;
}

export function NftImage({ image, sizes, className, alt, priority = false }: NftImageProps) {
  return (
    <picture className={cn('block overflow-hidden', className)}>
      {FORMATS.map((type) => {
        const variants = image.variants.filter((variant) => variant.type === type);
        if (variants.length === 0) return null;
        return (
          <source
            key={type}
            type={type}
            sizes={sizes}
            srcSet={variants
              .map((variant) => `${variant.url} ${String(variant.width)}w`)
              .join(', ')}
          />
        );
      })}
      <img
        src={image.url}
        alt={alt ?? image.alt}
        width={800}
        height={800}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        className="size-full object-cover"
      />
    </picture>
  );
}
