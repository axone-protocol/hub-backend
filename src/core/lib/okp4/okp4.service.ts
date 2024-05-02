/* eslint-disable @typescript-eslint/no-explicit-any */
import { config } from "@core/config/config";
import { BadRequestException, Injectable } from "@nestjs/common";
import { SupplyByDenomResponse } from "./responses/supply-by-denom.response";
import { GSFResponse } from "./responses/generic-success-failed.response";
import { FailedResponse } from "./responses/failed.response";
import { HttpRequester } from "@utils/http-requester";
import { Endpoints } from "./enums/endpoints.enum";
import { createUrlParams } from "@utils/create-url-params";

@Injectable()
export class Okp4Service {
    private BASE_URL = config.okp4.url;

    private constructUrl(endpoint: string, params?: string): string {
        return `${this.BASE_URL}/${endpoint}${params ? `?${params}` : ''}`;
    }

    async getSypplyByDenom(denom: string): Promise<SupplyByDenomResponse> {
        return this.errorHandleWrapper(
            HttpRequester.get.bind(
                null,
                this.constructUrl(
                  Endpoints.SUPPLY_BY_DENOM,
                  createUrlParams({ denom }),
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