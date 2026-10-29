export interface FailureRule {
  method?: string;
  /** Matched against the path after the API prefix, e.g. `^/nfts`. */
  path: RegExp;
  status: number;
  /** How many matching requests fail before the route recovers; omit to always fail. */
  times?: number;
}

export interface Scenario {
  name: string;
  description: string;
  catalog: 'default' | 'empty';
  latencyMs: { min: number; max: number };
  offline: boolean;
  failures: FailureRule[];
  sessionTtlMs: number;
}

const HOUR_MS = 3_600_000;

const defaultScenario: Scenario = {
  name: 'default',
  description: 'Seeded catalog, two users and realistic latency.',
  catalog: 'default',
  latencyMs: { min: 150, max: 350 },
  offline: false,
  failures: [],
  sessionTtlMs: 2 * HOUR_MS,
};

function variant(overrides: Partial<Scenario> & Pick<Scenario, 'name' | 'description'>): Scenario {
  return { ...defaultScenario, ...overrides };
}

export const SCENARIOS = [
  defaultScenario,
  variant({ name: 'empty', description: 'Catalog without NFTs.', catalog: 'empty' }),
  variant({
    name: 'slow',
    description: 'Every request takes ~2.5s.',
    latencyMs: { min: 2500, max: 2500 },
  }),
  variant({
    name: 'variable-latency',
    description: 'Latency between 50ms and 2s, so responses arrive out of order.',
    latencyMs: { min: 50, max: 2000 },
  }),
  variant({
    name: 'flaky',
    description: 'The first three catalog requests fail with 503, then the API recovers.',
    failures: [{ method: 'GET', path: /^\/nfts/, status: 503, times: 3 }],
  }),
  variant({
    name: 'offline',
    description: 'Every API request fails at the network level.',
    offline: true,
  }),
  variant({
    name: 'server-error',
    description: 'Every API request answers 500.',
    failures: [{ path: /.*/, status: 500 }],
  }),
  variant({
    name: 'favorites-failure',
    description: 'Favorite mutations fail with 500 to exercise optimistic rollback.',
    failures: [
      { method: 'PUT', path: /^\/favorites/, status: 500 },
      { method: 'DELETE', path: /^\/favorites/, status: 500 },
    ],
  }),
  variant({
    name: 'short-session',
    description: 'Sessions expire after 60 seconds.',
    sessionTtlMs: 60_000,
  }),
] as const satisfies readonly Scenario[];

export type ScenarioName = (typeof SCENARIOS)[number]['name'];

export function findScenario(name: string | null | undefined): Scenario | undefined {
  return SCENARIOS.find((scenario) => scenario.name === name);
}

export { defaultScenario };
