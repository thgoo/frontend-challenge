interface VersionedEvent {
  eventId: string;
  resource: { type: string; id: string };
  version: number;
}

const MAX_REMEMBERED_EVENTS = 500;

/** Drops duplicates and events older than the latest version seen for the same resource. */
export function createEventGate() {
  const seen = new Set<string>();
  const versions = new Map<string, number>();

  return {
    accept(event: VersionedEvent): boolean {
      if (seen.has(event.eventId)) return false;
      seen.add(event.eventId);
      if (seen.size > MAX_REMEMBERED_EVENTS) seen.delete(seen.values().next().value ?? '');

      const resourceKey = `${event.resource.type}:${event.resource.id}`;
      if (event.version <= (versions.get(resourceKey) ?? -1)) return false;
      versions.set(resourceKey, event.version);
      return true;
    },
  };
}
