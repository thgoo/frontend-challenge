/** Dependency-free contract of `window.__mocks`, shared with the Playwright suite. */
export interface MockControl {
  readonly scenarios: readonly { name: string; description: string }[];
  readonly scenario: string;
  reset(scenario?: string): Promise<void>;
  expireSessions(): void;
}

declare global {
  interface Window {
    __mocks?: MockControl;
  }
}
