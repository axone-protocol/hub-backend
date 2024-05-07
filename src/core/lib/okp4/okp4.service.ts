import { config } from "@core/config/config";
import { BadRequestException, Injectable } from "@nestjs/common";
import { SupplyByDenomResponse } from "./responses/supply-by-denom.response";
import { GSFResponse } from "./responses/generic-success-failed.response";
import { FailedResponse } from "./responses/failed.response";
import { Endpoints } from "./enums/endpoints.enum";
import { createUrlParams } from "@utils/create-url-params";
import { HttpService } from "../http.service";
import { WithPaginationResponse } from "./responses/with-pagination.response";
import { GetDelegationsResponse } from "./responses/get-delegations.response";

@Injectable()
export class Okp4Service {
  private BASE_URL = config.okp4.url;
  
  constructor(private readonly httpService: HttpService) {}


    private constructUrl(endpoint: string, params?: string): string {
        return `${this.BASE_URL}/${endpoint}${params ? `?${params}` : ''}`;
    }

    async getSupplyByDenom(denom: string): Promise<SupplyByDenomResponse> {
        return this.errorHandleWrapper(
            this.httpService.get.bind(
                null,
                this.constructUrl(
                  Endpoints.SUPPLY_BY_DENOM,
                  createUrlParams({ denom }),
                ),
              ),
        );
    }
  
    async getDelegations(addr: string): Promise<WithPaginationResponse<GetDelegationsResponse>> {
      return this.errorHandleWrapper(
        this.httpService.get.bind(
          null,
          this.constructUrl(`${Endpoints.STACKING_DELEGATIONS}/${addr}`,)
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