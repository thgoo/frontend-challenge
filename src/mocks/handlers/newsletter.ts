import { http, HttpResponse } from 'msw';
import { newsletterInputSchema } from '@/contracts/newsletter';
import { apiPath } from '../http/api';
import { readJson, validationError } from '../http/responses';

/** Accepts the signup without storing it: no other mocked feature reads newsletter subscribers. */
export const newsletterHandlers = [
  http.post(apiPath('/newsletter'), async ({ request }) => {
    const input = await readJson(request, newsletterInputSchema);
    if (!input.success) return validationError(input.error);
    return new HttpResponse(null, { status: 204 });
  }),
];
