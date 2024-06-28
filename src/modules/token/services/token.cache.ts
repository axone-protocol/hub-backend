import { Injectable } from "@nestjs/common";
import { TokenInfoDto } from "../dtos/token-info.dto";
import { HistoricalPrice } from "../dtos/historical-price.dto";
import { Range } from "@core/enums/range.enum";
import { RedisService } from "@core/lib/redis.service";
import { TokenCachePrefix } from "../enums/token-cache-prefix.enum";

@Injectable()
export class TokenCache {
  constructor(private readonly redisService: RedisService) { }

  async getTokenHistoricalPrice(range: Range): Promise<HistoricalPrice[]> {
    const serializedCache = await this.redisService.get(this.createRedisKey(range));
    return JSON.parse(serializedCache as string);
  }

  async setTokenHistoricalPrice(range: Range, data: unknown[]) {
    this.redisService.set(this.createRedisKey(range), JSON.stringify(data));
  }

  async cacheTokenInfo(info: TokenInfoDto) {
    const serialized = JSON.stringify(info);
    await this.redisService.set(this.createRedisKey(TokenCachePrefix.INFO), serialized);
  }

  async getTokenInfo() {
    return this.getObjectFromRedis(this.createRedisKey(TokenCachePrefix.INFO));
  }

  private async getObjectFromRedis<T>(key: string): Promise<T | null> {
    const serialized = await this.redisService.get(key);

    if (!serialized) {
      return null;
    }

    return JSON.parse(serialized as string);
  }

  private createRedisKey(...ids: string[]) {
    return ids.reduce((acc, id) => acc + `_${id}`, `${TokenCachePrefix.TOKEN}`);
  }
}