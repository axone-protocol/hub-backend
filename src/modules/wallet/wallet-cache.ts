import { Injectable } from "@nestjs/common";

import { RedisService } from "@core/lib/redis.service";
import { config } from "@core/config/config";
import { WalletPrefix } from "./enums/wallet-prefix.enum";

@Injectable()
export class WalletCache {
  constructor(
    private readonly redisService: RedisService,
  ) { }

  async setWalletRewardHistory(hash: string, history: unknown) {
    await this.redisService.setWithTTL(this.createRedisKey(WalletPrefix.REWARDS_HISTORY, hash), JSON.stringify(history), config.cache.walletRewardHistory);
  }

  async getWalletRewardHistory(hash: string) {
    return this.getObjectFromRedis(this.createRedisKey(WalletPrefix.REWARDS_HISTORY, hash));
  }

  private async getObjectFromRedis<T>(key: string): Promise<T | null> {
    const serialized = await this.redisService.get(key);

    if (!serialized) {
      return null;
    }

    return JSON.parse(serialized as string);
  }

  private createRedisKey(...ids: string[]) {
    return ids.reduce((acc, id) => acc + `_${id}`, `${WalletPrefix.WALLET}`);
  }
}