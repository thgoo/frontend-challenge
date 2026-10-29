import { defaultScenario, type Scenario } from './scenarios';

let current: Scenario = defaultScenario;

export function currentScenario(): Scenario {
  return current;
}

export function setCurrentScenario(scenario: Scenario) {
  current = scenario;
}
