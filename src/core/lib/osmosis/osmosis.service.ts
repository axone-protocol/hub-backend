/* eslint-disable @typescript-eslint/no-explicit-any */
import { BadRequestException, Injectable } from '@nestjs/common';

import { config } from '@core/config/config';
import { createUrlParams } from '@utils/create-url-params';
import { HttpRequester } from '@utils/http-requester';

import { GetHistoricalChartDto } from './dtos/get-historical-chart.dto';
import { Endpoints } from './enums/endpoints.enum';
import { RouteParam } from './enums/route-param.enum';
import { FailedResponse } from './responses/failed.response';
import { GSFResponse } from './responses/generic-success-failed.response';
import { HistoricalChartRes } from './responses/historical-chart.response';

@Injectable()
export class OsmosisService {
  private BASE_URL = config.osmosis.url;

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
      HttpRequester.get.bind(
        null,
        this.constructUrl(
          endpoint,
          createUrlParams({ tf: payload.range.toString() }),
        ),
      ),
    );
  }

  private async errorHandleWrapper<T>(fn: any): Promise<T> {
    try {
      const response: GSFResponse<T> = await fn();

      if (this.isFailedResponse(response)) {
        throw new BadRequestException(response.message);
      }

      return response as T;
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  private isFailedResponse<T>(response: GSFResponse<T>): response is FailedResponse {
    return (response as FailedResponse).message !== undefined;
  }
}
