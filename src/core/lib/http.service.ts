import { Injectable } from "@nestjs/common";


@Injectable()
export class HttpService {
  async get<T>(url: string, headers?: HeadersInit): Promise<T> {
    const res = await fetch(url, {
      method: 'get',
      headers,
    });

    return res.json();
  }

  async post<T>(
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
