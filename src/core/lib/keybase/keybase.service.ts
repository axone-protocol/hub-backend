import { BadRequestException, Injectable } from "@nestjs/common";
import { HttpService } from "../http.service";
import { config } from "@core/config/config";
import { GSFResponse } from "./responses/generic-success-failed.response";
import { FailedResponse } from "./responses/failed.response";
import { createUrlParams } from "@utils/create-url-params";
import { UserLookupResponse } from "./responses/user-lookup.response";

@Injectable()
export class KeybaseService {
  private BASE_URL = config.keybase.url;

  constructor(private readonly httpService: HttpService) {}

  private constructUrl(endpoint: string, params?: string): string {
    return `${this.BASE_URL}/${endpoint}${params ? `?${params}` : ''}`;
  }

  private getWithErrorHandling<T>(url: string): Promise<T> {
    return this.errorHandleWrapper(
      this.httpService.get.bind(
        null,
        url,
      ),
    );
  }

  async getUserLookup(key: string): Promise<UserLookupResponse> {
    return this.getWithErrorHandling(
      this.constructUrl(
        'user/lookup.json',
        createUrlParams({
          fields: 'pictures',
          key_suffix: key
        })
      )
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async errorHandleWrapper<T>(fn: any): Promise<T> {
    try {
      const response: GSFResponse<T> = await fn();

      if (this.isFailedResponse(response)) {
        throw new BadRequestException(response.status.name);
      }

      return response as T;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  private isFailedResponse<T>(response: GSFResponse<T>): response is FailedResponse {
    return (response as FailedResponse).status.code !== 0;
  }
}