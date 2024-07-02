import { RedisService } from "@core/lib/redis.service";
import { Injectable } from "@nestjs/common";
import { GovOverviewDto } from "../dto/gov-overview.dto";
import { GetProposalsResponse } from "@core/lib/okp4/responses/get-proposals.response";
import { GovCachePrefix } from "../enums/governance-cache-prefix.enum";
import { config } from "@core/config/config";
import { GetProposalResponse } from "@core/lib/okp4/responses/get-proposal.response";

@Injectable()
export class GovernanceCache {
  constructor(
    private readonly redisService: RedisService,
  ) { }

  async setGovOverview(overview: GovOverviewDto) {
    this.redisService.set(this.createRedisKey('overview'), JSON.stringify(overview));
  }

  async getGovOverview() {
    return this.getObjByRedisKey(this.createRedisKey('overview'));
  }

  async setProposals(proposals: unknown, hash: string) {
    const serialized = JSON.stringify(proposals);
    await this.redisService.setWithTTL(this.createRedisKey(GovCachePrefix.PROPOSALS, hash), serialized, config.cache.proposals);
  }

  async getProposals(hash: string): Promise<GetProposalsResponse> {
    return this.getObjByRedisKey(this.createRedisKey(GovCachePrefix.PROPOSALS, hash));
  }

  async setProposal(proposalId: string | number, proposal: unknown) {
    const serialized = JSON.stringify(proposal);
    await this.redisService.setWithTTL(this.createRedisKey(GovCachePrefix.PROPOSAL, String(proposalId)), serialized, config.cache.proposal);
  }

  async getProposal(proposalId: string | number): Promise<GetProposalResponse> {
    return this.getObjByRedisKey(this.createRedisKey(GovCachePrefix.PROPOSAL, String(proposalId)));
  }

  async setProposalVotes(hash: string, voters: unknown[]) {
    const serialized = JSON.stringify(voters);
    await this.redisService.setWithTTL(this.createRedisKey(GovCachePrefix.PROPOSAL_VOTERS, hash), serialized, config.cache.proposalVoters);
  }

  async getProposalVotes(hash: string) {
    const serialized = await this.redisService.get(this.createRedisKey(GovCachePrefix.PROPOSAL_VOTERS, hash));

    if (!serialized) {
      return null;
    }

    return JSON.parse(serialized as string);
  }

  private createRedisKey(...ids: string[]) {
    return `${GovCachePrefix.GOV}${ids.map(id => `_${id}`).join('')}`
  }

  private async getObjByRedisKey(key: string) {
    const serialized = await this.redisService.get(key);

    if (!serialized) {
      return null;
    }

    return JSON.parse(serialized as string);
  }
}