import { Okp4Service } from "@core/lib/okp4/okp4.service";
import { Injectable } from "@nestjs/common";

import { StackingCache } from "./stacking.cache";
import { config } from "@core/config/config";
import { MyStakedOverviewDto } from "../dtos/my-staked-overview.dto";

@Injectable()
export class StackingService {
  constructor(
    private readonly okp4Service: Okp4Service,
    private readonly cache: StackingCache,
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
    return res.validators.length.toString();
  }

  private async fetchDelegatorsRewards(address: string) {
    const res = await this.okp4Service.getDelegatorsRewards(address);
    return res.total.find(({denom}) => config.app.tokenDenom === denom)?.amount || '0';
  }

  private async fetchAvailableBalance(address: string) {
    const res = await this.okp4Service.getSpendableBalances(address);
    return res.balances.find(({ denom }) => config.app.tokenDenom === denom)?.amount || '0';
  }
}