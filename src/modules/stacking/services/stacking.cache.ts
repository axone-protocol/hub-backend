import { config } from "@core/config/config";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { Cache } from 'cache-manager';

@Injectable()
export class StackingCache {
  private redisStackingPrefix = 'stacking';

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
      return {};
    }

    return JSON.parse(serialized as string);
  }

  private createRedisKey(address: string) {
    return `${this.redisStackingPrefix}_${address}`;
  }
}