import { config } from "@core/config/config";
import { BadRequestException, Injectable } from "@nestjs/common";
import { HttpService } from "./http.service";

export interface GetLatestResponse {
  result: string;
  documentation: string;
  terms_of_use: string;
  time_last_update_unix: string;
  time_last_update_utc: string;
  time_next_update_unix: string;
  time_next_update_utc: string;
  base_code: string;
  conversion_rates: {
    EUR: number;
  };
}

@Injectable()
export class ExchangeRateService {
  constructor(private readonly httpService: HttpService) {}

  async getLatest(): Promise<GetLatestResponse> {
    return this.errorHandleWrapper(
      this.httpService.get.bind(
        null,
        `${config.exchangeRate.url}/${config.exchangeRate.key}/latest/USD`
      )
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async errorHandleWrapper<T>(fn: any): Promise<T> {
    try {
      const response: T = await fn();

      return response as T;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }
}
