import { config } from "@core/config/config";
import { BadRequestException, Injectable } from "@nestjs/common";
import { SupplyByDenomResponse } from "./responses/supply-by-denom.response";
import { GSFResponse } from "./responses/generic-success-failed.response";
import { FailedResponse } from "./responses/failed.response";
import { Endpoints } from "./enums/endpoints.enum";
import { createUrlParams } from "@utils/create-url-params";
import { HttpService } from "../http.service";
import { GetDelegationsResponse } from "./responses/get-delegations.response";
import { RouteParam } from "./enums/route-param.enum";
import { DelegatorValidatorsResponse } from "./responses/delegators-validators.response";
import { DelegatorsRewardsResponse } from "./responses/delegators-rewards.response";
import { SpendableBalancesResponse } from "./responses/spendable-balances.response";
import { SupplyResponse } from "./responses/supply.response";
import { ValidatorStatus } from "./enums/validator-status.enum";
import { ValidatorDelegationsResponse } from "./responses/validator-delegations.response";

@Injectable()
export class Okp4Service {
  private BASE_URL = config.okp4.url;
  
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

  async getSupplyByDenom(denom: string): Promise<SupplyByDenomResponse> {
    return this.getWithErrorHandling(
      this.constructUrl(
        Endpoints.SUPPLY_BY_DENOM,
        createUrlParams({ denom }),
      )
    );
  }
  
  async getDelegations(addr: string): Promise<GetDelegationsResponse> {
    return this.getWithErrorHandling(this.constructUrl(`${Endpoints.STAKING_DELEGATIONS}/${addr}`));
  }

  async getDelegatorsValidators(addr: string): Promise<DelegatorValidatorsResponse> {
    return this.getWithErrorHandling(
      this.constructUrl(
        Endpoints.DELEGATORS_VALIDATORS.replace(
          RouteParam.DELEGATOR_ADDRES,
          addr,
        )
      )
    );
  }

  async getDelegatorsRewards(addr: string): Promise<DelegatorsRewardsResponse> {
    return this.getWithErrorHandling(
      this.constructUrl(
        Endpoints.DELEGATORS_REWARDS.replace(
          RouteParam.DELEGATOR_ADDRES,
          addr,
        )
      )
    );
  }

  async getSpendableBalances(addr: string): Promise<SpendableBalancesResponse> {
    return this.getWithErrorHandling(this.constructUrl(`${Endpoints.SPENDABLE_BALANCE}/${addr}`));
  }

  async getBondValidators() {
    return this.getValidators(ValidatorStatus.BONDED);
  }

  async getValidators(status?: string): Promise<DelegatorValidatorsResponse> {
    let params = undefined;
    if (status) {
      params = createUrlParams({ status });
    }
    const url = this.constructUrl(
      Endpoints.VALIDATORS,
      params,
    );
    return this.getWithErrorHandling(url);
  }

  async getTotalSupply(): Promise<SupplyResponse> {
    const url = this.constructUrl(
      Endpoints.TOTAL_SUPPLY,
    );
    return this.getWithErrorHandling(url);
  }

  async getValidatorDelegations(validatorAddr: string, limit?: number, offset?: number): Promise<ValidatorDelegationsResponse> {
    let params = undefined;
    if (limit && offset) {
      params = createUrlParams({
        'pagination.offset': offset.toString(),
        'pagination.limit': limit.toString(),
        'pagination.count_total': true.toString()
      })
    }
    return this.getWithErrorHandling(
      this.constructUrl(
        Endpoints.VALIDATO_DELEGATIONS.replace(
          RouteParam.VALIDATOR_ADDRES,
          validatorAddr,
        ),
        params
      )
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