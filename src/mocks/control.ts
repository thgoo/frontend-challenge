import type { MockControl } from './control-api';
import { initDb, resetDb, transaction } from './db/store';
import { resetNetworkConditions } from './handlers/network';
import { cancelSettlements, scheduleSettlements } from './realtime/settlement-scheduler';
import { currentScenario, setCurrentScenario } from './runtime';
import { defaultScenario, findScenario, SCENARIOS } from './scenarios';

const SCENARIO_STORAGE_KEY = 'nft-mocks:scenario';
async function reset(name: string = currentScenario().name) {
  const scenario = findScenario(name);
  if (!scenario) throw new Error(`Unknown mock scenario "${name}"`);
  setCurrentScenario(scenario);
  localStorage.setItem(SCENARIO_STORAGE_KEY, scenario.name);
  resetNetworkConditions();
  cancelSettlements();
  await resetDb(scenario);
}

function expireSessions() {
  transaction(({ db, now }) => {
    const past = new Date(now - 1).toISOString();
    db.sessions = db.sessions.map((session) => ({ ...session, expiresAt: past }));
  });
}

export const mockControl: MockControl = {
  scenarios: SCENARIOS.map(({ name, description }) => ({ name, description })),
  get scenario() {
    return currentScenario().name;
  },
  reset,
  expireSessions,
};

/** `?scenario=<name>` switches and resets, `?reset` restores the current scenario's seed. */
export async function initControl() {
  const url = new URL(window.location.href);
  const requested = url.searchParams.get('scenario');
  const shouldReset = requested !== null || url.searchParams.has('reset');

  if (requested !== null && !findScenario(requested)) {
    console.warn(`[mocks] Unknown scenario "${requested}", using "${defaultScenario.name}".`);
  }
  const scenario =
    findScenario(requested) ??
    findScenario(localStorage.getItem(SCENARIO_STORAGE_KEY)) ??
    defaultScenario;

  if (shouldReset) {
    await reset(scenario.name);
    url.searchParams.delete('scenario');
    url.searchParams.delete('reset');
    window.history.replaceState(window.history.state, '', url);
  } else {
    setCurrentScenario(scenario);
    await initDb(scenario);
  }
  scheduleSettlements();
}
