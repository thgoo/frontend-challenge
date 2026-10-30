import { authHandlers } from './handlers/auth';
import { cartHandlers } from './handlers/cart';
import { checkoutHandlers } from './handlers/checkout';
import { favoriteHandlers } from './handlers/favorites';
import { unknownEndpointHandler } from './handlers/fallback';
import { networkConditionsHandler } from './handlers/network';
import { newsletterHandlers } from './handlers/newsletter';
import { nftHandlers } from './handlers/nfts';
import { profileHandlers } from './handlers/profile';
import { walletConnectionHandlers } from './handlers/wallet-connection';
import { walletHandlers } from './handlers/wallets';

/** Order matters: network conditions first, the unknown-endpoint fallback last. */
export const handlers = [
  networkConditionsHandler,
  ...authHandlers,
  ...nftHandlers,
  ...favoriteHandlers,
  ...cartHandlers,
  ...checkoutHandlers,
  ...profileHandlers,
  ...walletHandlers,
  ...walletConnectionHandlers,
  ...newsletterHandlers,
  unknownEndpointHandler,
];
