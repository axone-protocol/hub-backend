// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace HttpRequester {
  export async function get<T>(url: string, headers?: HeadersInit): Promise<T> {
    const res = await fetch(url, {
      method: 'get',
      headers,
    });

    return res.json();
  }

  export async function post<T>(
    url: string,
    body: BodyInit,
    headers?: HeadersInit,
  ): Promise<T> {
    const res = await fetch(url, {
      method: 'post',
      body,
      headers,
    });

    return res.json();
  }
}
