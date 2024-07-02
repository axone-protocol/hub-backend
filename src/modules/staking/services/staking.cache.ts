import { config } from "@core/config/config";
import { Injectable } from "@nestjs/common";
import { StakingCachePrefix } from "../enums/staking-cache-prefix.enum";
import { RedisService } from "@core/lib/redis.service";
import { v4 } from 'uuid';

@Injectable()
export class StakingCache {
  constructor(
    private readonly redisService: RedisService,
  ) { }

  private async getObjectFromRedis<T>(key: string): Promise<T | null> {
    const serialized = await this.redisService.get(key);

    if (!serialized) {
      return null;
    }

    return JSON.parse(serialized as string);
  }

  async setMyStakedOverview(address: string, info: unknown) {
    const serialized = JSON.stringify(info);
    await this.redisService.setWithTTL(this.createRedisKey(address), serialized, config.cache.myStakingOverview);
  }

  async getMyStakedOverview(address: string) {
    return this.getObjectFromRedis(this.createRedisKey(address));
  }

  async setGlobalStakedOverview(data: unknown) {
    const serialized = JSON.stringify(data);
    await this.redisService.setWithTTL(this.createRedisKey(StakingCachePrefix.GLOBAL_OVERVIEW), serialized, config.cache.globalStakingOverview);
  }

  async getGlobalStakedOverview() {
    return this.getObjectFromRedis(this.createRedisKey(StakingCachePrefix.GLOBAL_OVERVIEW));
  }

  async setValidators(validators: unknown[]) {
    const serialized = JSON.stringify(validators);
    await this.redisService.setWithTTL(this.createRedisKey(StakingCachePrefix.VALIDATORS), serialized, config.cache.validators);
  }

  async getValidators() {
    return this.getObjectFromRedis(this.createRedisKey(StakingCachePrefix.VALIDATORS));
  }

  async setValidatorDelegation(hash: string, data: unknown) {
    await this.redisService.setWithTTL(
      this.createRedisKey(hash),
      JSON.stringify(data),
      config.cache.validators
    );
  }

  async getValidatorDelegation(hash: string) {
    return this.getObjectFromRedis(this.createRedisKey(hash));
  }

  async setValidatorImg(id: string, imgUrl: string) {
    this.redisService.set(this.createRedisKey(StakingCachePrefix.VALIDATOR_IMG, id), imgUrl);
  }

  async getValidatorImg(id: string) {
    return this.redisService.get(this.createRedisKey(StakingCachePrefix.VALIDATOR_IMG, id));
  }

  async setValidatorSignatures(address: string, blocks: unknown) {
    const key = this.createRedisKey(StakingCachePrefix.VALIDATOR_SIGNATURES, address, v4());
    this.redisService.setWithTTL(key, JSON.stringify(blocks), config.cache.validatorSignature);
  }

  async getValidatorSignatures(address: string) {
    const pattern = this.createRedisKey(StakingCachePrefix.VALIDATOR_SIGNATURES, address, '*');
    const keys = await this.redisService.keys(pattern);
    const signatures = await Promise.all(keys.map((key: string) => this.redisService.get(key)));

    return signatures.map(signature => JSON.parse(signature!));
  }

  async setRecentlyProposedBlock(address: string, block: unknown) {
    const key = this.createRedisKey(this.createRedisKey(StakingCachePrefix.VALIDATOR_RECENTLY_PROPOSED_BLOCKS, address), v4());
    this.redisService.setWithTTL(key, JSON.stringify(block), config.cache.validatorRecentlyProposedBlock);
  }

  async getRecentlyProposedBlock(address: string) {
    const pattern = this.createRedisKey(this.createRedisKey(StakingCachePrefix.VALIDATOR_RECENTLY_PROPOSED_BLOCKS, address), '*');
    const keys = await this.redisService.keys(pattern);
    const recentlyProposedBlocks = await Promise.all(keys.map((key: string) => this.redisService.get(key)));

    return recentlyProposedBlocks.map(block => JSON.parse(block!));
  }

  async setLastBlock(block: unknown) {
    this.redisService.set(this.createRedisKey(StakingCachePrefix.LAST_BLOCK), JSON.stringify(block));
  }

  async getLastBlock() {
    const serialized = await this.redisService.get(this.createRedisKey(StakingCachePrefix.LAST_BLOCK));

    if (!serialized) {
      return null;
    }

    return JSON.parse(serialized as string);
  }

  private createRedisKey(...ids: string[]) {
    return ids.reduce((acc, id) => acc + `_${id}`, `${StakingCachePrefix.STAKING}`);
  }
}
