import { Routes } from "@core/enums/routes.enum";
import { Controller, Get, Param, Query } from "@nestjs/common";
import { StakingService } from "./services/staking.service";
import { StakingEndpoints } from "./enums/staking-endpoints.enum";
import { QueryParam } from "./enums/query-param.enum";
import { SchemaValidatePipe } from "@core/pipes/schema-validate.pipe";
import { AddressSchema } from "./schemas/address.schema";
import { MyValidatorDelegationSchema } from "./schemas/my-validator-delegation.schema";
import { MyValidatorDelegationDto } from "./dtos/my-validator-delegation.dto";
import { ValidatorDelegationsSchema } from "./schemas/validator-delegations.schema";
import { ValidatorDelegationsDto } from "./dtos/validator-delegations.dto";
import { StringSchema } from "@core/schemas/string.schema";
import { GetProposalVotersSchema } from "./schemas/get-proposal-voters.schema";
import { Pagination } from "@core/types/pagination.dto";

@Controller(Routes.STAKING)
export class StakingController {
  constructor(
    private readonly service: StakingService,
  ) { }

  @Get(StakingEndpoints.MY_OVERVIEW)
  async getMyStakedOverview(
    @Query(QueryParam.ADDRESS, new SchemaValidatePipe(AddressSchema))
      address: string,
  ) {
    return await this.service.getMyStakedOverview(address);
  }

  @Get(StakingEndpoints.OVERVIEW)
  async getGlobalOverview() {
    return this.service.getGlobalOverview();
  }

  @Get(StakingEndpoints.VALIDATORS)
  async getValidators() {
    return this.service.getValidators();
  }

  @Get(StakingEndpoints.MY_VALIDATOR_DELEGATION)
  async getMyValidatorDelegation(
    @Query(new SchemaValidatePipe(MyValidatorDelegationSchema))
      params: MyValidatorDelegationDto,
  ) {
    return this.service.getMyValidatorDelegation(params);
  }

  @Get(StakingEndpoints.VALIDATOR_DELEGATIONS)
  async getValidatorDelegations(
    @Query(new SchemaValidatePipe(ValidatorDelegationsSchema))
      params: ValidatorDelegationsDto,
  ) {
    return this.service.getValidatorDelegations(params);
  }

  @Get(StakingEndpoints.VALIDATORS_BY_ADDRESS)
  async getValidatorByAddress(
    @Param(QueryParam.ADDRESS, new SchemaValidatePipe(StringSchema))
      address: string,
  ) {
    return this.service.getValidatorByAddress(address);
  }

  @Get(StakingEndpoints.VALIDATORS_UPTIME)
  async getValidatorUptime(
    @Param(QueryParam.ADDRESS, new SchemaValidatePipe(StringSchema))
      address: string,
  ) {
    return this.service.getValidatorUptime(address);
  }

  @Get(StakingEndpoints.VALIDATORS_RECENTLY_PROPOSED_BLOCKS)
  async getValidatorRecentlyProposedBlocks(
    @Param(QueryParam.ADDRESS, new SchemaValidatePipe(StringSchema))
      address: string,
  ) {
    return this.service.getValidatorRecentlyProposedBlocks(address);
  }

  @Get(StakingEndpoints.PROPOSALS)
  async getProposals() {
    return this.service.getProposals();
  }

  @Get(StakingEndpoints.PROPOSAL)
  async getProposal(
    @Param(QueryParam.PROPOSAL_ID, new SchemaValidatePipe(StringSchema))
      proposalId: string,
  ) {
    return this.service.getProposal(proposalId);
  }

  @Get(StakingEndpoints.PROPOSAL_VOTERS)
  async getProposalVoters(
    @Param(QueryParam.PROPOSAL_ID, new SchemaValidatePipe(StringSchema))
      id: string,
    @Query(new SchemaValidatePipe(GetProposalVotersSchema))
      query: Pagination
  ) {
    return this.service.getProposalVotes({
      id,
      ...query
    })
  }
}
