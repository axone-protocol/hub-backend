import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { GovernanceService } from "./governance.service";

@Injectable()
export class GovernanceJobs {
  constructor(
    private readonly service: GovernanceService,
  ) { }

  @Cron('*/5 * * * *')
  async updateGovOverview() {
    await this.service.fetchAndCacheGovOverview();
  }
}