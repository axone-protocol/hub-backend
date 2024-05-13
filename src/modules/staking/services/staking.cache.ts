import { config } from "@core/config/config";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { Cache } from 'cache-manager';

@Injectable()
export class StakingCache {
  private redisStakingPrefix = 'staking';
  private globalOverviewPrefix = 'global_overview';
  private validatorsPrefix = 'validators';

  constructor(
    @Inject(CACHE_MANAGER) private cacheService: Cache,
  ) { }

  private async getObjByRedisKey(key: string) {
    const serialized = await this.cacheService.get(key);

    if (!serialized) {
      return null;
    }

    return JSON.parse(serialized as string);
  }

  async setMyStakedOverview(address: string, info: unknown) {
    const serialized = JSON.stringify(info);
    await this.cacheService.set(this.createRedisKey(address), serialized, config.cache.myStakingOverview);
  }

  async getMyStakedOverview(address: string) {
    return this.getObjByRedisKey(this.createRedisKey(address));
  }

  async setGlobalStakedOverview(data: unknown) {
    const serialized = JSON.stringify(data);
    await this.cacheService.set(this.createRedisKey(this.globalOverviewPrefix), serialized, config.cache.globalStakingOverview);
  }

  async getGlobalStakedOverview() {
    return this.getObjByRedisKey(this.createRedisKey(this.globalOverviewPrefix));
  }

  async setValidators(validators: unknown[]) {
    const serialized = JSON.stringify(validators);
    await this.cacheService.set(this.createRedisKey(this.validatorsPrefix), serialized, config.cache.validators);
  }

  async getValidators() {
    return this.getObjByRedisKey(this.createRedisKey(this.validatorsPrefix));
  }

  private createRedisKey(id: string) {
    return `${this.redisStakingPrefix}_${id}`;
  }
}