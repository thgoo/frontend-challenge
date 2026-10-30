import { Mail } from 'lucide-react';
import { SOCIAL_NETWORKS } from '@/components/layout/social-networks';

function BrandIcon({ name }: { name: string }) {
  const network = SOCIAL_NETWORKS.find((candidate) => candidate.name === name);
  if (!network) return null;
  return (
    <svg aria-hidden="true" viewBox={network.viewBox} className="size-4">
      {network.paths.map((path) => (
        <path key={path.d} d={path.d} fill="currentColor" />
      ))}
    </svg>
  );
}

export function ShareLinks({ title }: { title: string }) {
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent(`${title} na Kurio`);
  const links = [
    {
      label: 'Compartilhar no LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      icon: <BrandIcon name="LinkedIn" />,
    },
    {
      label: 'Compartilhar por e-mail',
      href: `mailto:?subject=${text}&body=${url}`,
      icon: <Mail aria-hidden="true" className="size-4" />,
    },
    {
      label: 'Compartilhar no X (Twitter)',
      href: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      icon: <BrandIcon name="X (Twitter)" />,
    },
  ];

  return (
    <div className="flex items-center gap-3">
      <p className="text-[15px] font-bold">Compartilhar este NFT:</p>
      <ul className="flex items-center gap-2">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${link.label} (abre em nova aba)`}
              className="grid size-6 place-items-center rounded hover:text-highlight"
            >
              {link.icon}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
