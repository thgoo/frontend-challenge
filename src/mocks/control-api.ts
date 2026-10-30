/** Dependency-free contract of `window.__mocks`, shared with the Playwright suite. */
export interface MockControl {
  readonly scenarios: readonly { name: string; description: string }[];
  readonly scenario: string;
  reset(scenario?: string): Promise<void>;
  expireSessions(): void;
  /** Changes the catalog like a backend would: REST reflects it and `nft.updated` is emitted. */
  updateEdition(
    nftId: string,
    editionId: string,
    patch: { priceEth?: string; available?: number },
  ): void;
  readonly sockets: {
    /** Open client connections, so tests can wait for the socket before publishing events. */
    connectionCount(): number;
    deliveredEvents(): { eventId: string; type: string; resourceId: string; version: number }[];
    /** Sends an already delivered event again, to exercise duplicate and stale handling. */
    redeliver(eventId: string): void;
    disconnect(): void;
    setOnline(online: boolean): void;
  };
}

declare global {
  interface Window {
    __mocks?: MockControl;
  }
}
