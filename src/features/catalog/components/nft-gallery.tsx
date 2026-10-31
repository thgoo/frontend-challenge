import { cn } from 'cn';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { NftImage } from '@/components/nft-image';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Nft } from '@/contracts/nft';

export function NftGallery({ nft }: { nft: Nft }) {
  const { images } = nft;
  const [selected, setSelected] = useState(0);
  const current = images[selected] ?? images[0];

  return (
    <div className="flex gap-7">
      {images.length > 1 && (
        <ul className="hidden w-[100px] shrink-0 gap-4 lg:grid" aria-label="Miniaturas">
          {images.map((image, index) => (
            <li key={image.alt}>
              <button
                type="button"
                aria-label={`Mostrar imagem ${String(index + 1)} de ${String(images.length)}`}
                aria-pressed={index === selected}
                onClick={() => {
                  setSelected(index);
                }}
                className="block overflow-hidden rounded-lg bg-card ring-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none aria-pressed:ring-1"
              >
                <NftImage image={image} alt="" sizes="100px" className="size-[100px]" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative flex-1 lg:rounded-md lg:bg-card lg:p-4">
        <NftImage
          image={current}
          sizes="(min-width: 1024px) 404px, 100vw"
          priority
          className="aspect-square w-full rounded-3xl"
        />
        {images.length > 1 && (
          <div
            role="group"
            aria-label="Imagens"
            className="absolute inset-x-0 bottom-[41px] flex justify-center lg:hidden"
          >
            {images.map((image, index) => (
              <button
                key={image.alt}
                type="button"
                aria-label={`Mostrar imagem ${String(index + 1)} de ${String(images.length)}`}
                aria-pressed={index === selected}
                onClick={() => {
                  setSelected(index);
                }}
                className="flex h-6 min-w-6 items-center justify-center px-[3.5px]"
              >
                <span
                  className={cn(
                    'h-[7px] rounded-full bg-primary transition-[width] motion-reduce:transition-none',
                    index === selected ? 'w-7' : 'w-[7px]',
                  )}
                />
              </button>
            ))}
          </div>
        )}
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label="Ampliar imagem"
              className={cn(
                'absolute top-3 right-3 hidden size-[30px] place-items-center rounded-full bg-background text-foreground lg:grid',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              )}
            >
              <Search aria-hidden="true" className="size-4" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl p-2 sm:max-w-3xl">
            <DialogTitle className="sr-only">{current.alt}</DialogTitle>
            <NftImage image={current} sizes="768px" className="aspect-square w-full rounded-xl" />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
