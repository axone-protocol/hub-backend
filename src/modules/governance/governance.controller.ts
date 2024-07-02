import { Controller, Get, Param, Query } from "@nestjs/common";
import { GovernanceCache } from "./services/governance.cache";
import { GovernanceEndpoint } from "./enums/governance-endpoint.enum";
import { Routes } from "@core/enums/routes.enum";
import { QueryParam } from "@core/enums/query-param.enum";
import { Pagination } from "@core/types/pagination.dto";
import { SchemaValidatePipe } from "@core/pipes/schema-validate.pipe";
import { StringSchema } from "@core/schemas/string.schema";
import { GovernanceService } from "./services/governance.service";
import { PaginationSchema } from "@core/schemas/pagination.schema";

@Controller(Routes.GOVERNANCE)
export class GovernanceController {
  constructor(
    private readonly cache: GovernanceCache,
    private readonly service: GovernanceService,
  ) { }
  
  @Get(GovernanceEndpoint.OVERVIEW)
  async overview() {
    return this.cache.getGovOverview();
  }

  @Get(GovernanceEndpoint.PROPOSALS)
  async getProposals(
    @Query(new SchemaValidatePipe(PaginationSchema))
      query: Pagination
  ) {
    return this.service.getProposals(query);
  }

  @Get(GovernanceEndpoint.PROPOSAL)
  async getProposal(
    @Param(QueryParam.PROPOSAL_ID, new SchemaValidatePipe(StringSchema))
      proposalId: string,
  ) {
    return this.service.getProposal(proposalId);
  }

  @Get(GovernanceEndpoint.PROPOSAL_VOTERS)
  async getProposalVoters(
    @Param(QueryParam.PROPOSAL_ID, new SchemaValidatePipe(StringSchema))
      id: string,
    @Query(new SchemaValidatePipe(PaginationSchema))
      query: Pagination
  ) {
    return this.service.getProposalVotes({
      id,
      ...query
    })
  }
}