const DAY_MS = 86_400_000;

const now = new Date();
const SNAPSHOT_MS = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

export const TODAY_ISO = new Date(SNAPSHOT_MS).toISOString().slice(0, 10);

export function isoDaysFromNow(days: number) {
  return new Date(SNAPSHOT_MS + days * DAY_MS).toISOString().slice(0, 10);
}

export function daysUntil(isoDate: string) {
  return (Date.parse(isoDate) - SNAPSHOT_MS) / DAY_MS;
}
