import { config } from "@core/config/config";
import { Injectable } from "@nestjs/common";
import { createHash } from 'crypto';
import { StakingCachePrefix } from "../enums/staking-cache-prefix.enum";
import { RedisService } from "@core/lib/redis.service";
import { v4 } from 'uuid';
import { GetProposalsResponse } from "@core/lib/okp4/responses/get-proposals.response";
import { GetProposalResponse } from "@core/lib/okp4/responses/get-proposal.response";

@Injectable()
export class StakingCache {
  constructor(
    private readonly redisService: RedisService,
  ) { }

  private async getObjByRedisKey(key: string) {
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
    return this.getObjByRedisKey(this.createRedisKey(address));
  }

  async setGlobalStakedOverview(data: unknown) {
    const serialized = JSON.stringify(data);
    await this.redisService.setWithTTL(this.createRedisKey(StakingCachePrefix.GLOBAL_OVERVIEW), serialized, config.cache.globalStakingOverview);
  }

  async getGlobalStakedOverview() {
    return this.getObjByRedisKey(this.createRedisKey(StakingCachePrefix.GLOBAL_OVERVIEW));
  }

  async setValidators(validators: unknown[]) {
    const serialized = JSON.stringify(validators);
    await this.redisService.setWithTTL(this.createRedisKey(StakingCachePrefix.VALIDATORS), serialized, config.cache.validators);
  }

  async getValidators() {
    return this.getObjByRedisKey(this.createRedisKey(StakingCachePrefix.VALIDATORS));
  }

  async setValidatorDelegation(address: string, validatorAddress: string, data: unknown) {
    const serialized = JSON.stringify(data);
    const hash = this.createValidatorDelegationHash(address, validatorAddress);
    await this.redisService.setWithTTL(
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

  async setRecentlyProposedBlock(block: unknown) {
    const key = this.createRedisKey(StakingCachePrefix.VALIDATOR_RECENTLY_PROPOSED_BLOCKS, v4());
    this.redisService.setWithTTL(key, JSON.stringify(block), config.cache.validatorSignature);
  }

  async getRecentlyProposedBlock() {
    const pattern = this.createRedisKey(StakingCachePrefix.VALIDATOR_RECENTLY_PROPOSED_BLOCKS, '*');
    const keys = await this.redisService.keys(pattern);
    const recentlyProposedBlocks = await Promise.all(keys.map((key: string) => this.redisService.get(key)));

    return recentlyProposedBlocks.map(block => JSON.parse(block!));
  }

  private createRedisKey(...ids: string[]) {
    return ids.reduce((acc, id) => acc + `_${id}`, `${StakingCachePrefix.STAKING}`);
  }

  async setProposals(proposals: GetProposalsResponse) {
    const serialized = JSON.stringify(proposals);
    await this.redisService.setWithTTL(this.createRedisKey(StakingCachePrefix.PROPOSALS), serialized, config.cache.proposals);
  }

  async getProposals(): Promise<GetProposalsResponse> {
    return this.getObjByRedisKey(this.createRedisKey(StakingCachePrefix.PROPOSALS));
  }

  async setProposal(proposalId: string | number, proposal: GetProposalResponse) {
    const serialized = JSON.stringify(proposal);
    await this.redisService.setWithTTL(this.createRedisKey(StakingCachePrefix.PROPOSAL, String(proposalId)), serialized, config.cache.proposal);
  }

  async getProposal(proposalId: string | number): Promise<GetProposalResponse> {
    return this.getObjByRedisKey(this.createRedisKey(StakingCachePrefix.PROPOSAL, String(proposalId)));
  }
}
