export function makeDocNumber(prefix: string) {
  return `${prefix}-${Date.now()}`;
}
