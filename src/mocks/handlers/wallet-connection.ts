import { http, HttpResponse } from 'msw';
import { walletConnectionInputSchema } from '@/contracts/wallet';
import { readDb, transaction } from '../db/store';
import { apiPath } from '../http/api';
import { apiError, readJson, validationError } from '../http/responses';
import { authenticate } from '../http/session';
import { currentScenario } from '../runtime';

/** Simulates the browser wallet extension handshake, which is out of scope for a real integration. */
export const walletConnectionHandlers = [
  http.get(apiPath('/wallet-connection'), ({ cookies }) => {
    const auth = authenticate(cookies);
    return auth.ok
      ? HttpResponse.json(readDb().walletConnections[auth.user.id] ?? null)
      : auth.response;
  }),

  http.put(apiPath('/wallet-connection'), async ({ request, cookies }) => {
    const auth = authenticate(cookies);
    if (!auth.ok) return auth.response;
    const input = await readJson(request, walletConnectionInputSchema);
    if (!input.success) return validationError(input.error);

    if (!readDb().wallets[auth.user.id]?.some((wallet) => wallet.id === input.data.walletId)) {
      return apiError(422, 'VALIDATION_FAILED', 'Select one of your wallets.', {
        walletId: 'Select a wallet',
      });
    }
    if (currentScenario().walletConnection === 'reject') {
      return apiError(403, 'WALLET_REJECTED', 'The wallet rejected the connection request.');
    }
    const connection = transaction(({ db, now }) => {
      db.walletConnections[auth.user.id] = {
        ...input.data,
        connectedAt: new Date(now).toISOString(),
      };
      return db.walletConnections[auth.user.id];
    });
    return HttpResponse.json(connection);
  }),

  http.delete(apiPath('/wallet-connection'), ({ cookies }) => {
    const auth = authenticate(cookies);
    if (!auth.ok) return auth.response;
    transaction(({ db }) => {
      const { [auth.user.id]: removed, ...others } = db.walletConnections;
      db.walletConnections = others;
    });
    return new HttpResponse(null, { status: 204 });
  }),
];
