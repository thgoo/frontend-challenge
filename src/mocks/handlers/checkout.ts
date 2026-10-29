import { delay, http, HttpResponse } from 'msw';
import { createOrderInputSchema, IDEMPOTENCY_HEADER } from '@/contracts/order';
import { quoteRequestSchema } from '@/contracts/quote';
import { readDb, transaction } from '../db/store';
import { applyCheckoutDisruption } from '../domain/checkout-disruption';
import { createQuote, placeOrder, settleDueOrders, toOrderDto } from '../domain/orders';
import { apiPath } from '../http/api';
import { apiError, failureResponse, readJson, validationError } from '../http/responses';
import { authenticate } from '../http/session';
import { scheduleSettlements } from '../realtime/settlement-scheduler';
import { currentScenario } from '../runtime';

export const checkoutHandlers = [
  http.post(apiPath('/quotes'), async ({ request, cookies }) => {
    const auth = authenticate(cookies);
    if (!auth.ok) return auth.response;
    const input = await readJson(request, quoteRequestSchema);
    if (!input.success) return validationError(input.error);

    const quote = transaction((tx) => createQuote(tx, auth.user.id, input.data.network));
    return quote.ok ? HttpResponse.json(quote.value, { status: 201 }) : failureResponse(quote);
  }),

  http.post(apiPath('/orders'), async ({ request, cookies }) => {
    const auth = authenticate(cookies);
    if (!auth.ok) return auth.response;
    const idempotencyKey = request.headers.get(IDEMPOTENCY_HEADER);
    if (!idempotencyKey) {
      return apiError(422, 'VALIDATION_FAILED', `The ${IDEMPOTENCY_HEADER} header is required.`);
    }
    const input = await readJson(request, createOrderInputSchema);
    if (!input.success) return validationError(input.error);

    const scenario = currentScenario();
    const result = transaction((tx) => {
      applyCheckoutDisruption(tx, scenario.checkoutDisruption, input.data.quoteId);
      return placeOrder(tx, auth.user, input.data, {
        idempotencyKey,
        outcome: scenario.payment.outcome,
        settleAfterMs: scenario.payment.settleAfterMs,
      });
    });
    if (!result.ok) return failureResponse(result);

    const { order, replayed } = result.value;
    if (replayed) return HttpResponse.json(order);
    scheduleSettlements();
    if (scenario.orderTimeout) await delay('infinite');
    return HttpResponse.json(order, { status: 201 });
  }),

  http.get(apiPath('/orders'), ({ cookies }) => {
    const auth = authenticate(cookies);
    if (!auth.ok) return auth.response;
    transaction(settleDueOrders);
    const orders = readDb()
      .orders.filter((order) => order.userId === auth.user.id)
      .map(toOrderDto)
      .reverse();
    return HttpResponse.json(orders);
  }),

  http.get<{ id: string }>(apiPath('/orders/:id'), ({ params, cookies }) => {
    const auth = authenticate(cookies);
    if (!auth.ok) return auth.response;
    transaction(settleDueOrders);
    const order = readDb().orders.find((candidate) => candidate.id === params.id);
    if (!order) return apiError(404, 'NOT_FOUND', 'This order does not exist.');
    if (order.userId !== auth.user.id)
      return apiError(403, 'FORBIDDEN', 'This order belongs to another account.');
    return HttpResponse.json(toOrderDto(order));
  }),
];
