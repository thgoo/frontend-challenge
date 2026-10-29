import { http, HttpResponse } from 'msw';
import { walletInputSchema, walletRoleSchema, type Wallet } from '@/contracts/wallet';
import { readDb, transaction } from '../db/store';
import { nextId } from '../domain/ids';
import { apiPath } from '../http/api';
import { apiError, readJson, validationError } from '../http/responses';
import { authenticate } from '../http/session';

function walletsOf(userId: string): Wallet[] {
  return readDb().wallets[userId] ?? [];
}

export const walletHandlers = [
  http.get(apiPath('/wallets'), ({ cookies }) => {
    const auth = authenticate(cookies);
    return auth.ok ? HttpResponse.json(walletsOf(auth.user.id)) : auth.response;
  }),

  http.put<{ role: string }>(apiPath('/wallets/:role'), async ({ request, params, cookies }) => {
    const auth = authenticate(cookies);
    if (!auth.ok) return auth.response;
    const role = walletRoleSchema.safeParse(params.role);
    if (!role.success) return apiError(404, 'NOT_FOUND', 'Unknown wallet slot.');
    const input = await readJson(request, walletInputSchema);
    if (!input.success) return validationError(input.error);

    const wallets = walletsOf(auth.user.id);
    const address = input.data.address.toLowerCase();
    if (
      wallets.some(
        (wallet) => wallet.role !== role.data && wallet.address.toLowerCase() === address,
      )
    ) {
      return apiError(409, 'CONFLICT', 'This address is already registered.', {
        address: 'Already used by your other wallet',
      });
    }

    transaction(({ db }) => {
      const existing = wallets.find((wallet) => wallet.role === role.data);
      const updated: Wallet = {
        ...input.data,
        id: existing?.id ?? nextId(db, 'wal'),
        role: role.data,
      };
      db.wallets[auth.user.id] = [...wallets.filter((wallet) => wallet !== existing), updated].sort(
        (a, b) => a.role.localeCompare(b.role),
      );
    });
    return HttpResponse.json(walletsOf(auth.user.id));
  }),
];
