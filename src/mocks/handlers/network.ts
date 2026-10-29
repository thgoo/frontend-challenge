import { delay, http, HttpResponse } from 'msw';
import { currentScenario } from '../runtime';
import { createRandom, randomInt } from '../db/random';
import { apiPath, apiRelativePath } from '../http/api';
import { apiErrorForStatus } from '../http/responses';
import type { FailureRule } from '../scenarios';

const LATENCY_SEED = 42;
let random = createRandom(LATENCY_SEED);
const failureCounts = new Map<FailureRule, number>();

export function resetNetworkConditions() {
  random = createRandom(LATENCY_SEED);
  failureCounts.clear();
}

function matchFailure(request: Request): FailureRule | undefined {
  const path = apiRelativePath(request.url);
  return currentScenario().failures.find(
    (rule) =>
      (!rule.method || rule.method === request.method) &&
      rule.path.test(path) &&
      (rule.times === undefined || (failureCounts.get(rule) ?? 0) < rule.times),
  );
}

/**
 * Runs before every business handler. Returning nothing lets MSW fall through to the
 * next matching handler, so business handlers stay unaware of network conditions.
 */
export const networkConditionsHandler = http.all(apiPath('/*'), async ({ request }) => {
  const { latencyMs, offline } = currentScenario();
  await delay(randomInt(random, latencyMs.min, latencyMs.max));
  if (offline) return HttpResponse.error();

  const failure = matchFailure(request);
  if (!failure) return undefined;
  failureCounts.set(failure, (failureCounts.get(failure) ?? 0) + 1);
  return apiErrorForStatus(failure.status);
});
