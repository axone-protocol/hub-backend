import { Okp4Service } from "@core/lib/okp4/okp4.service";
import { Injectable } from "@nestjs/common";

import { StakingCache } from "./staking.cache";
import { config } from "@core/config/config";
import { MyStakedOverviewDto } from "../dtos/my-staked-overview.dto";
import { OsmosisService } from "@core/lib/osmosis/osmosis.service";
import { Validator } from "@core/lib/okp4/responses/delegators-validators.response";
import Big from "big.js";
import { GlobalStakedOverviewDto } from "../dtos/global-staked-overview.dto";

@Injectable()
export class StakingService {
  constructor(
    private readonly okp4Service: Okp4Service,
    private readonly cache: StakingCache,
    private readonly osmosisService: OsmosisService,
  ) { }
    
  async getMyStakedOverview(address: string) {
    const cache = await this.cache.getMyStakedOverview(address);

    if (cache === null) {
      return this.fetchAndCacheMyStakedOverview(address);
    }

    return cache;
  }

  private async fetchAndCacheMyStakedOverview(address: string) {
    const res = await Promise.all([
      this.fetchMyStakedAmount(address),
      this.fetchDelegatorsValidatorsAmount(address),
      this.fetchDelegatorsRewards(address),
      this.fetchAvailableBalance(address),
    ]);
    const myStakedOverviewDto: MyStakedOverviewDto = {
      stakedAmount: res[0],
      delegations: res[1],
      claimableReward: res[2],
      availableBalance: res[3],
    }

    await this.cache.setMyStakedOverview(address, myStakedOverviewDto);
    return myStakedOverviewDto;
  }

  private async fetchMyStakedAmount(address: string) {
    const res = await this.okp4Service.getDelegations(address);
    return res.delegation_responses.reduce((acc, val) => acc + +val.balance.amount, 0).toString();
  }

  private async fetchDelegatorsValidatorsAmount(address: string) {
    const res = await this.okp4Service.getDelegatorsValidators(address);
    return res.pagination.total;
  }

  private async fetchDelegatorsRewards(address: string) {
    const res = await this.okp4Service.getDelegatorsRewards(address);
    return res.total.find(({denom}) => config.app.tokenDenom === denom)?.amount || '0';
  }

  private async fetchAvailableBalance(address: string) {
    const res = await this.okp4Service.getSpendableBalances(address);
    return res.balances.find(({ denom }) => config.app.tokenDenom === denom)?.amount || '0';
  }

  async getGlobalOverview() {
    const cache = await this.cache.getGlobalStakedOverview();

    if (cache === null) {
      return this.fetchAndCacheGlobalStakedOverview();
    }

    return cache;
  }


  private async fetchAndCacheGlobalStakedOverview(): Promise<GlobalStakedOverviewDto> {
    const rez = await Promise.all([
      this.okp4Service.getValidators(),
      this.osmosisService.getStakingApr(),
      this.fetchTotalSupply(),
    ]);

    const totalStaked = this.calculateTotalStaked(rez[0].validators);

    const dto: GlobalStakedOverviewDto = {
      totalValidators: rez[0].pagination.total,
      apr: rez[1].toString(),
      totalStaked,
      bondedTokens: Big(totalStaked).div(rez[2]!.amount).toString(),
    }

    await this.cache.setGlobalStakedOverview(dto);

    return dto;
  }

  private calculateTotalStaked(validators: Validator[]): string {
    const totalStaked = validators.reduce((acc, val) => acc.add(val.delegator_shares), Big(0));
    return totalStaked.toString();
  }

  private async fetchTotalSupply() {
    const res = await this.okp4Service.getTotalSupply();
    return res.supply.find(({ denom }) => denom === config.app.tokenDenom);
  }
}