type URLSearchParamInit =
  | string
  | URLSearchParams
  | string[][]
  | Record<string, string>
  | undefined;

export function createUrlParams(params: URLSearchParamInit): string {
  const url = new URLSearchParams(params);
  return url.toString();
}
