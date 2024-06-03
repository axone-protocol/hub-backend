import { RedisService } from "@core/lib/redis.service";
import { Injectable } from "@nestjs/common";
import { GovOverviewDto } from "../dto/gov-overview.dto";

@Injectable()
export class GovernanceCache {
  private governanceCachePrefix = 'governance';

  constructor(
    private readonly redisService: RedisService,
  ) { }

  async setGovOverview(overview: GovOverviewDto) {
    this.redisService.set(this.createRedisKey('overview'), JSON.stringify(overview));
  }

  async getGovOverview() {
    const res = await this.redisService.get(this.createRedisKey('overview'));

    if (res) {
      return JSON.parse(res);
    }
    
    return null;
  }

  private createRedisKey(...ids: string[]) {
    return `${this.governanceCachePrefix}${ids.map(id => `_${id}`).join('')}`
  }
}