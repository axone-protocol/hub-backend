import { Injectable } from "@nestjs/common";
import { TokenInfoDto } from "../dtos/token-info.dto";
import { HistoricalPrice } from "../dtos/historical-price.dto";
import { PrismaService } from "@core/lib/prisma.service";
import { Range } from "@core/enums/range.enum";
import { RedisService } from "@core/lib/redis.service";

@Injectable()
export class TokenCache {
  private redisTokenPrefix = 'token';
  private tokenInfoPrefix = 'info';

  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) { }
    
  async getCacheByRange(range: Range): Promise<HistoricalPrice[]> {
    const serializedCache = await this.redisService.get(this.createRedisKey(range));
    return JSON.parse(serializedCache as string);
  }

  async cacheTokenInfo(info: TokenInfoDto) {
    const serialized = JSON.stringify(info);
    await this.redisService.set(this.createRedisKey(this.tokenInfoPrefix), serialized);
  }

  async getTokenInfo() {
    const serialized = await this.redisService.get(this.createRedisKey(this.tokenInfoPrefix));

    if (!serialized) {
      return {};
    }

    return JSON.parse(serialized as string);
  }

  async cacheTokenHistoricalPrice(range: Range, data: unknown[]) {
    this.redisService.set(this.createRedisKey(range), JSON.stringify(data));
  }

  private createRedisKey(id: string) {
    return `${this.redisTokenPrefix}_${id}`;
  }
}