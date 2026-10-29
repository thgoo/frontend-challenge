import { authHandlers } from './handlers/auth';
import { unknownEndpointHandler } from './handlers/fallback';
import { networkConditionsHandler } from './handlers/network';
import { nftHandlers } from './handlers/nfts';

/** Order matters: network conditions first, the unknown-endpoint fallback last. */
export const handlers = [
  networkConditionsHandler,
  ...authHandlers,
  ...nftHandlers,
  unknownEndpointHandler,
];
