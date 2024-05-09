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
    
  async cacheUserStacking(address: string, info: unknown) {
    const serialized = JSON.stringify(info);
    await this.cacheService.set(this.createRedisKey(address), serialized, config.cache.userStackingTtl);
  }

  async getUserStacking(address: string) {
    return this.cacheService.get(this.createRedisKey(address));
  }

  private createRedisKey(address: string) {
    return `${this.redisStackingPrefix}_${address}`;
  }
}