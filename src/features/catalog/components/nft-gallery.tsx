import { useState } from 'react';
import type { Nft } from '@/contracts/nft';

export function NftGallery({ images }: { images: Nft['images'] }) {
  const [selected, setSelected] = useState(0);
  const current = images[selected] ?? images[0];

  return (
    <div className="grid gap-4">
      {current && (
        <img
          src={current.url}
          alt={current.alt}
          width={800}
          height={800}
          fetchPriority="high"
          className="aspect-square w-full rounded-2xl object-cover"
        />
      )}
      {images.length > 1 && (
        <ul className="flex gap-3" aria-label="Gallery thumbnails">
          {images.map((image, index) => (
            <li key={image.url}>
              <button
                type="button"
                aria-label={`Show image ${index + 1} of ${images.length}`}
                aria-pressed={index === selected}
                onClick={() => {
                  setSelected(index);
                }}
                className="overflow-hidden rounded-lg ring-offset-2 ring-offset-background aria-pressed:ring-2 aria-pressed:ring-primary"
              >
                <img
                  src={image.url}
                  alt=""
                  width={80}
                  height={80}
                  className="size-20 object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
