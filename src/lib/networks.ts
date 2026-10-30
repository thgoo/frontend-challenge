import type { Network } from '@/contracts/wallet';

export const NETWORK_LABELS: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  arbitrum: 'Arbitrum',
  base: 'Base',
};

export const EXPLORER_LABELS: Record<Network, string> = {
  ethereum: 'Etherscan',
  polygon: 'Polygonscan',
  arbitrum: 'Arbiscan',
  base: 'Basescan',
};
