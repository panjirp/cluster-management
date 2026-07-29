export function compareBlockNumber(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true });
}
