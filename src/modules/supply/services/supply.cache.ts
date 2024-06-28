import { Injectable } from "@nestjs/common";

import { Range } from "@core/enums/range.enum";
import { RedisService } from "@core/lib/redis.service";
import { config } from "@core/config/config";
import { SupplyCachePrefix } from "../enums/supply-cache-prefix.enum";

@Injectable()
export class SupplyCache {
  constructor(
    private readonly redisService: RedisService,
  ) { }

  async getSupplyHistorical(range: Range) {
    return this.getObjectFromRedis(this.createRedisKey(range));
  }

  async setSupplyHistorical(range: Range, data: unknown[]) {
    this.redisService.set(this.createRedisKey(range), JSON.stringify(data));
  }

  async setSupplyChange(range: Range, data: unknown) {
    this.redisService.setWithTTL(this.createRedisKey(SupplyCachePrefix.CHANGE, range), JSON.stringify(data), config.cache.supplyChange);
  }

  async getSupplyChange(range: Range) {
    return this.getObjectFromRedis(this.createRedisKey(SupplyCachePrefix.CHANGE, range));
  }

  private async getObjectFromRedis<T>(key: string): Promise<T | null> {
    const serialized = await this.redisService.get(key);

    if (!serialized) {
      return null;
    }

    return JSON.parse(serialized as string);
  }

  private createRedisKey(...ids: string[]) {
    return ids.reduce((acc, id) => acc + `_${id}`, `${SupplyCachePrefix.SUPPLY}`);
  }
}