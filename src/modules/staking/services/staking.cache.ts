import { config } from "@core/config/config";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { Cache } from 'cache-manager';

@Injectable()
export class StakingCache {
  private redisStakingPrefix = 'staking';
  private globalOverviewPrefix = 'global_overview';

  constructor(
    @Inject(CACHE_MANAGER) private cacheService: Cache,
  ) { }
    
  async setMyStakedOverview(address: string, info: unknown) {
    const serialized = JSON.stringify(info);
    await this.cacheService.set(this.createRedisKey(address), serialized, config.cache.myStakingOverview);
  }

  async getMyStakedOverview(address: string) {
    const serialized = await this.cacheService.get(this.createRedisKey(address));

    if (!serialized) {
      return null;
    }

    return JSON.parse(serialized as string);
  }

  async setGlobalStakedOverview(data: unknown) {
    const serialized = JSON.stringify(data);
    await this.cacheService.set(this.createRedisKey(this.globalOverviewPrefix), serialized, config.cache.globalStakingOverview);
  }

  async getGlobalStakedOverview() {
    const serialized = await this.cacheService.get(this.createRedisKey(this.globalOverviewPrefix));

    if (!serialized) {
      return null;
    }

    return JSON.parse(serialized as string);
  }

  private createRedisKey(id: string) {
    return `${this.redisStakingPrefix}_${id}`;
  }
}