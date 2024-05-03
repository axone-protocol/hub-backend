import { BadRequestException, Injectable } from '@nestjs/common';

import { config } from '@core/config/config';
import { createUrlParams } from '@utils/create-url-params';

import { GetHistoricalChartDto } from './dtos/get-historical-chart.dto';
import { Endpoints } from './enums/endpoints.enum';
import { RouteParam } from './enums/route-param.enum';
import { FailedResponse } from './responses/failed.response';
import { GSFResponse } from './responses/generic-success-failed.response';
import { HistoricalChartRes } from './responses/historical-chart.response';
import { HttpService } from '../http.service';

@Injectable()
export class OsmosisService {
  private BASE_URL = config.osmosis.url;

  constructor(private readonly httpService: HttpService) {}

  private constructUrl(endpoint: string, params?: string): string {
    return `${this.BASE_URL}/${endpoint}${params ? `?${params}` : ''}`;
  }

  async getHistoricalChart(
    payload: GetHistoricalChartDto,
  ): Promise<HistoricalChartRes> {
    const endpoint = Endpoints.HISTORICAL_PRICE.replace(
      RouteParam.SYMBOL,
      payload.symbol,
    );

    return this.errorHandleWrapper(
      this.httpService.get.bind(
        null,
        this.constructUrl(
          endpoint,
          createUrlParams({ tf: payload.range.toString() }),
        ),
      ),
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async errorHandleWrapper<T>(fn: any): Promise<T> {
    try {
      const response: GSFResponse<T> = await fn();

      if (this.isFailedResponse(response)) {
        throw new BadRequestException(response.message);
      }

      return response as T;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  private isFailedResponse<T>(response: GSFResponse<T>): response is FailedResponse {
    return (response as FailedResponse).message !== undefined;
  }
}
