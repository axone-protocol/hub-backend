import { Okp4Service } from "@core/lib/okp4/okp4.service";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { GovOverviewDto } from "../dto/gov-overview.dto";
import { Proposal } from "@core/lib/okp4/responses/get-proposals.response";
import { ProposalStatusEnum } from "@core/lib/okp4/enums/proposal-status.enum";
import { GovernanceCache } from "./governance.cache";
import { Log } from "@core/loggers/log";
import { toPercents } from "@utils/to-percents";
import { createHash } from "crypto";
import { GetProposalVotesDto } from "../dto/get-proposal-votes.dto";
import Big from "big.js";
import { Pagination } from "@core/types/pagination.dto";

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

  async getProposals(payload: Pagination) {
    const cache = await this.cache.getProposals(this.createParamHash(payload));

    if (cache === null) {
      return this.fetchProposals(payload);
    }

    return cache;
  }

  private async fetchProposals({ limit, offset }: Pagination) {
    const res = await this.okp4Service.getProposals(limit, offset);
    const proposalsWithTurnout = [];

    for (const proposal of res.proposals) {
      const quorum = await this.calculateQuorum(proposal);
      proposalsWithTurnout.push({
        ...proposal,
        turnout: quorum,
      });
    }

    const view = {
      pagination: {
        total: +res.pagination.total,
        limit: limit === undefined ? null : limit,
        offset: offset === undefined ? null : offset,
      },
      proposals: proposalsWithTurnout,
    };

    await this.cache.setProposals(view, this.createParamHash({ limit, offset }));

    return view;
  }

  private async fetchProposal(proposalId: string | number) {
    const res = await this.okp4Service.getProposal(proposalId);
    const proposalVote = await this.fetchProposalVote(res.proposal);
    const proposalWithVote = {
      proposal: {
        ...res.proposal,
        ...proposalVote,
      },
    };
    await this.cache.setProposal(proposalId, proposalWithVote);
    return proposalWithVote;
  }

  async getProposal(proposalId: string | number) {
    const cache = await this.cache.getProposal(proposalId);

    if (cache === null) {
      return this.fetchProposal(proposalId);
    }

    return cache;
  }

  async fetchProposalVote(proposal: Proposal) {
    const voteOverview = await this.calculateVoteOverview(proposal);
    const vote = this.calculateVote(proposal);
    return {
      vote,
      voteOverview,
    };
  }

  private async calculateVoteOverview(proposal: Proposal) {
    const quorum = await this.calculateQuorum(proposal);
    const threshold = await this.calculateThreshold(proposal);
    const votingPeriod = {
      start: proposal.voting_start_time,
      end: proposal.voting_end_time,
    };
    return {
      quorum,
      threshold,
      votingPeriod,
    };
  }

  private async calculateQuorum(proposal: Proposal): Promise<string> {
    const votesSum = this.voteSum(proposal);
    const pool = await this.okp4Service.getStakingPool();

    if (!pool?.pool?.bonded_tokens) return "0";

    return toPercents(Big(votesSum).div(pool.pool.bonded_tokens));
  }

  private voteSum(proposal: Proposal): number {
    return Big(proposal.final_tally_result.yes_count)
      .plus(proposal.final_tally_result.abstain_count)
      .plus(proposal.final_tally_result.no_count)
      .plus(proposal.final_tally_result.no_with_veto_count)
      .toNumber();
  }

  private async calculateThreshold(proposal: Proposal): Promise<string> {
    return toPercents(
      Big(proposal.final_tally_result.yes_count).div(
        Big(proposal.final_tally_result.yes_count)
          .plus(proposal.final_tally_result.no_count)
          .plus(proposal.final_tally_result.no_with_veto_count)
      )
    );
  }

  private calculateVote(proposal: Proposal) {
    const votingEnds = proposal.voting_end_time;
    const total = proposal.total_deposit
      .reduce((acc, deposit) => acc.plus(deposit.amount), Big(0))
      .toString();
    const voteSum = this.voteSum(proposal);
    const tallyInPercents = {
      yes: toPercents(Big(proposal.final_tally_result.yes_count).div(voteSum)),
      no: toPercents(Big(proposal.final_tally_result.no_count).div(voteSum)),
      abstain: toPercents(
        Big(proposal.final_tally_result.abstain_count).div(voteSum)
      ),
      noWithVeto: toPercents(
        Big(proposal.final_tally_result.no_with_veto_count).div(voteSum)
      ),
    };

    return {
      total,
      votingEnds,
      tallyInPercents,
    };
  }

  async getProposalVotes(payload: GetProposalVotesDto) {
    const cache = await this.cache.getProposalVotes(
      this.createParamHash(payload)
    );

    if (!cache) {
      return this.fetchProposalVotes(payload);
    }

    return cache;
  }

  private async fetchProposalVotes(payload: GetProposalVotesDto) {
    const res = await this.okp4Service.getProposalVotes(
      payload.id,
      payload.limit,
      payload.offset
    );
    const voters = res.votes.map((vote) => {
      const maxWeightOption = vote.options.reduce(
        (max, current) =>
          parseFloat(current.weight) > parseFloat(max.weight) ? current : max,
        vote.options[0]
      );

      return {
        voter: vote.voter,
        option: maxWeightOption.option,
      };
    });
    await this.cache.setProposalVotes(this.createParamHash(payload), voters);
    return {
      voters,
      pagination: {
        total: +res.pagination.total,
        limit: payload.limit === undefined ? null : payload.limit,
        offset: payload.offset === undefined ? null : payload.offset,
      },
    };
  }

  private createParamHash(params: unknown): string {
    return createHash("sha256").update(JSON.stringify(params)).digest("hex");
  }
}
