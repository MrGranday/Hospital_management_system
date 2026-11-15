const DAY_MS = 86_400_000;
const snapshot = new Date();

export const TODAY_ISO = snapshot.toISOString().slice(0, 10);

export function isoDaysFromNow(days: number) {
  return new Date(snapshot.getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

export function daysUntil(isoDate: string) {
  return (new Date(isoDate).getTime() - snapshot.getTime()) / DAY_MS;
}
