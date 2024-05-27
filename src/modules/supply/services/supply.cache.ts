import { Injectable } from "@nestjs/common";

import { ChangeIntervalDto } from "../dtos/change-interval.dto";
import { Range } from "@core/enums/range.enum";
import { RedisService } from "@core/lib/redis.service";

@Injectable()
export class SupplyCache {
  private redisSupplyPrefix = 'supply';
  
  constructor(
    private readonly redisService: RedisService,
  ) { }

  async getSupplyHistorical(range: Range): Promise<ChangeIntervalDto[]> {
    const serializedCache = await this.redisService.get(this.createRedisKey(range));
    return JSON.parse(serializedCache as string);
  }

  async setSupplyHistorical(range: Range, data: unknown[]) {
    this.redisService.set(this.createRedisKey(range), JSON.stringify(data));
  }

  private createRedisKey(range: Range) {
    return `${this.redisSupplyPrefix}_${range}`;
  }
}