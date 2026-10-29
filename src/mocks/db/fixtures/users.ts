import type { Wallet } from '@/contracts/wallet';

/** Fictitious credentials documented in the README. */
export const USER_FIXTURES = [
  {
    id: 'usr_alice',
    name: 'Alice Collector',
    username: 'alice',
    email: 'alice@example.com',
    password: 'Password123',
    bio: 'Collector of generative art.',
    avatarUrl: null,
  },
  {
    id: 'usr_bob',
    name: 'Bob Buyer',
    username: 'bob',
    email: 'bob@example.com',
    password: 'Password123',
    bio: '',
    avatarUrl: null,
  },
] as const;

export const WALLET_FIXTURES: Record<string, Wallet[]> = {
  usr_alice: [
    {
      id: 'wal_alice_1',
      label: 'Main MetaMask',
      address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      provider: 'metamask',
      role: 'primary',
    },
    {
      id: 'wal_alice_2',
      label: 'Coinbase vault',
      address: '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
      provider: 'coinbase',
      role: 'secondary',
    },
  ],
  usr_bob: [],
};
