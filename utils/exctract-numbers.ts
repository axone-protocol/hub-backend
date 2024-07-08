export function extractNumbers(string: string): number[] {
  const matches = string.match(/\d+/g);
  if (matches) {
    return matches.map(Number);
  }
  return [];
}