import { Controller, Get } from "@nestjs/common";
import { GovernanceCache } from "./services/governance.cache";
import { GovernanceEndpoint } from "./enums/governance-endpoint.enum";
import { Routes } from "@core/enums/routes.enum";

@Controller(Routes.GOVERNANCE)
export class GovernanceController {
  constructor(private readonly cache: GovernanceCache) { }
  
  @Get(GovernanceEndpoint.OVERVIEW)
  async overview() {
    return this.cache.getGovOverview();
  }
}