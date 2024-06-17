import { Okp4Service } from "@core/lib/okp4/okp4.service";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { GovOverviewDto } from "../dto/gov-overview.dto";
import { Proposal } from "@core/lib/okp4/responses/get-proposals.response";
import { ProposalStatusEnum } from "@core/lib/okp4/enums/proposal-status.enum";
import { GovernanceCache } from "./governance.cache";
import { Log } from "@core/loggers/log";

@Injectable()
export class GovernanceService implements OnModuleInit {
  constructor(
    private readonly okp4Service: Okp4Service,
    private readonly cache: GovernanceCache
  ) {}

  async onModuleInit() {
    await this.fetchAndCacheGovOverview();
  }

  async fetchAndCacheGovOverview() {
    try {
      const govResponse = await this.okp4Service.getGovParams();
      const govProposals = await this.okp4Service.getProposals();

      const govOverview: GovOverviewDto = {
        totalProposals: Number.parseInt(govProposals.pagination.total),
        currentProposals: this.currentProposals(govProposals.proposals),
        votingPeriod: this.votingPeriodToView(
          govResponse.voting_params.voting_period
        ),
        depositRequired: govResponse?.params?.min_deposit[0]?.amount || "0",
      };

      this.cache.setGovOverview(govOverview);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      Log.warn("Failed to fetch and cache gov overview " + e.message);
    }
  }

  private currentProposals(proposals: Proposal[]) {
    const activeStatuses: string[] = [
      ProposalStatusEnum.PROPOSAL_STATUS_DEPOSIT_PERIOD,
      ProposalStatusEnum.PROPOSAL_STATUS_UNSPECIFIED,
      ProposalStatusEnum.PROPOSAL_STATUS_VOTING_PERIOD,
    ];
    return proposals.reduce((acc, val) => {
      if (activeStatuses.includes(val.status)) {
        let count = acc;
        count += 1;
        return count;
      }
      return acc;
    }, 0);
  }

  private votingPeriodToView(votingPeriod: string) {
    const totalSeconds = Number.parseInt(votingPeriod.slice(0, -1), 10);

    const days = totalSeconds / 86400;

    return `${Number.isInteger(days) ? days : days.toFixed(1)}`;
  }
}
