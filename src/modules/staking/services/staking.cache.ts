import { config } from "@core/config/config";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { createHash } from 'crypto';
import { Cache } from 'cache-manager';
import { StakingCachePrefix } from "../enums/staking-cache-prefix.enum";

@Injectable()
export class StakingCache {
  constructor(
    @Inject(CACHE_MANAGER) private cacheService: Cache,
  ) { }

  private async getObjByRedisKey(key: string) {
    const serialized = await this.cacheService.get(key);

    if (!serialized) {
      return null;
    }

    return JSON.parse(serialized as string);
  }

  async setMyStakedOverview(address: string, info: unknown) {
    const serialized = JSON.stringify(info);
    await this.cacheService.set(this.createRedisKey(address), serialized, config.cache.myStakingOverview);
  }

  async getMyStakedOverview(address: string) {
    return this.getObjByRedisKey(this.createRedisKey(address));
  }

  async setGlobalStakedOverview(data: unknown) {
    const serialized = JSON.stringify(data);
    await this.cacheService.set(this.createRedisKey(StakingCachePrefix.GLOBAL_OVERVIEW), serialized, config.cache.globalStakingOverview);
  }

  async getGlobalStakedOverview() {
    return this.getObjByRedisKey(this.createRedisKey(StakingCachePrefix.GLOBAL_OVERVIEW));
  }

  async setValidators(validators: unknown[]) {
    const serialized = JSON.stringify(validators);
    await this.cacheService.set(this.createRedisKey(StakingCachePrefix.VALIDATORS), serialized, config.cache.validators);
  }

  async getValidators() {
    return this.getObjByRedisKey(this.createRedisKey(StakingCachePrefix.VALIDATORS));
  }

  async setValidatorDelegation(address: string, validatorAddress: string, data: unknown) {
    const serialized = JSON.stringify(data);
    const hash = this.createValidatorDelegationHash(address, validatorAddress);
    await this.cacheService.set(
      this.createRedisKey(hash),
      serialized,
      config.cache.validators
    );
  }

  async getValidatorDelegation(address: string, validatorAddress: string) {
    const hash = this.createValidatorDelegationHash(address, validatorAddress);
    return this.getObjByRedisKey(this.createRedisKey(hash));
  }

  private createValidatorDelegationHash(address: string, validatorAddress: string) {
    const hash = createHash('sha256');
    hash.update(`${address}_${validatorAddress}`);
    return hash.digest('hex');
  }

  async setValidatorImg(id: string, imgUrl: string) {
    this.cacheService.set(this.createRedisKey(StakingCachePrefix.VALIDATOR_IMG, id), imgUrl);
  }

  async getValidatorImg(id: string) {
    return this.cacheService.get(this.createRedisKey(StakingCachePrefix.VALIDATOR_IMG, id));
  }

  private createRedisKey(...ids: string[]) {
    return ids.reduce((acc, id) => acc + `_${id}`, `${StakingCachePrefix.STAKING}`);
  }
}