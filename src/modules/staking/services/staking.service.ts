import { Okp4Service } from "@core/lib/okp4/okp4.service";
import { BadRequestException, Injectable, OnModuleInit } from "@nestjs/common";

import { StakingCache } from "./staking.cache";
import { config } from "@core/config/config";
import { MyStakedOverviewDto } from "../dtos/my-staked-overview.dto";
import { Validator } from "@core/lib/okp4/responses/delegators-validators.response";
import Big from "big.js";
import { GlobalStakedOverviewDto } from "../dtos/global-staked-overview.dto";
import { ValidatorStatus } from "@core/lib/okp4/enums/validator-status.enum";
import { ValidatorStatusView } from "../enums/validator-status-view.enum";
import { ValidatorsViewDto } from "../dtos/validators-view.dto";
import { MyValidatorDelegationDto } from "../dtos/my-validator-delegation.dto";
import { Delegation } from "@core/lib/okp4/responses/validator-delegations.response";
import { ValidatorDelegationsDto } from "../dtos/validator-delegations.dto";
import { KeybaseService } from "@core/lib/keybase/keybase.service";
import { Log } from "@core/loggers/log";
import { UserLookupResponse } from "@core/lib/keybase/responses/user-lookup.response";
import { StakingError } from "../enums/staking-error.enum";
import {
  BlocksResponse,
  Signature,
} from "@core/lib/okp4/responses/blocks.response";
import { Event } from "@core/enums/event.enum";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { toPercents } from "@utils/to-percents";
import { RecentlyProposedBlockDto } from "../dtos/recently-proposed-block.dto";
import { SignatureDto } from "../dtos/signature.dto";
import { SignatureViewStatus } from "../enums/signature-view-status.enum";
import { Reward } from "@core/lib/okp4/responses/delegators-rewards.response";
import { Proposal } from "@core/lib/okp4/responses/get-proposals.response";
import { createHash } from "crypto";
import { GetProposalVotesDto } from "../dtos/get-proposal-votes.dto";

@Injectable()
export class StakingService implements OnModuleInit {
  constructor(
    private readonly okp4Service: Okp4Service,
    private readonly cache: StakingCache,
    private readonly keybaseService: KeybaseService,
    private eventEmitter: EventEmitter2
  ) {}

  async onModuleInit() {
    try {
      await this.loadAndCacheValidatorImages();
      await this.okp4Service.connectToNewBlockSocket(Event.BLOCK_UPDATE);
      this.eventEmitter.on(Event.BLOCK_UPDATE, (blocks: BlocksResponse) =>
        this.newBlock(blocks)
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      Log.warn("Staking init problem " + e.message);
    }
  }

  async getMyStakedOverview(address: string) {
    const cache = await this.cache.getMyStakedOverview(address);

    if (cache === null) {
      return this.fetchAndCacheMyStakedOverview(address);
    }

    return cache;
  }

  private async fetchAndCacheMyStakedOverview(address: string) {
    const res = await Promise.all([
      this.fetchMyStakedAmount(address),
      this.fetchDelegatorsValidatorsAmount(address),
      this.fetchDelegatorsRewards(address),
      this.fetchAvailableBalance(address),
    ]);
    const myStakedOverviewDto: MyStakedOverviewDto = {
      stakedAmount: res[0],
      delegations: res[1],
      claimableReward: res[2],
      availableBalance: res[3],
    };

    await this.cache.setMyStakedOverview(address, myStakedOverviewDto);
    return myStakedOverviewDto;
  }

  private async fetchMyStakedAmount(
    address: string,
    validatorAddress?: string
  ) {
    const res = await this.okp4Service.getDelegations(address);
    const filteredResponses = validatorAddress
      ? res.delegation_responses.filter(
        (val) => val.delegation.validator_address === validatorAddress
      )
      : res.delegation_responses;
    const totalAmount = filteredResponses.reduce(
      (acc, val) => acc + +val.balance.amount,
      0
    );
    return totalAmount.toString();
  }

  private async fetchDelegatorsValidatorsAmount(address: string) {
    const res = await this.okp4Service.getDelegatorsValidators(address);
    return res.pagination.total;
  }

  private async fetchDelegatorsRewards(
    address: string,
    validatorAddress?: string
  ) {
    const res = await this.okp4Service.getDelegatorsRewards(address);
    const totalRewards = this.calculateRewardForValidator(
      res.rewards,
      validatorAddress
    );
    return totalRewards.toString();
  }

  private calculateRewardForValidator(
    rewards: Reward[],
    validatorAddress?: string
  ) {
    return rewards
      .filter((val) =>
        validatorAddress ? val.validator_address === validatorAddress : true
      )
      .reduce(
        (acc, val) =>
          acc + Number.parseFloat(val.reward.find(({ denom }) => config.app.tokenDenom === denom)?.amount || "0"),
        0
      );
  }

  private async fetchAvailableBalance(address: string) {
    const res = await this.okp4Service.getSpendableBalances(address);
    return (
      res.balances.find(({ denom }) => config.app.tokenDenom === denom)
        ?.amount || "0"
    );
  }

  async getGlobalOverview() {
    const cache = await this.cache.getGlobalStakedOverview() as GlobalStakedOverviewDto;

    if (cache === null) {
      return this.fetchAndCacheGlobalStakedOverview();
    }

    return cache;
  }

  private async fetchAndCacheGlobalStakedOverview(): Promise<GlobalStakedOverviewDto> {
    const rez = await Promise.all([
      this.okp4Service.getBondValidators(),
      this.okp4Service.getApr(),
      this.fetchTotalSupply(),
      this.okp4Service.getStakingPool(),
    ]);

    const totalStaked = this.calculateTotalStaked(rez[0].validators);

    const dto: GlobalStakedOverviewDto = {
      totalValidators: rez[0].pagination.total,
      apr: rez[1],
      totalStaked,
      bondedTokens: toPercents(Big(rez[3].pool.bonded_tokens).div(rez[2]!.amount)),
    };

    await this.cache.setGlobalStakedOverview(dto);

    return dto;
  }

  private calculateTotalStaked(validators: Validator[]): string {
    const totalStaked = validators.reduce(
      (acc, val) => acc.add(val.delegator_shares),
      Big(0)
    );
    return totalStaked.toString();
  }

  private async fetchTotalSupply() {
    const res = await this.okp4Service.getTotalSupply();
    return res.supply.find(({ denom }) => denom === config.app.tokenDenom);
  }

  async getValidators() {
    const cache = await this.cache.getValidators() as Validator[];

    if (cache === null) {
      return this.fetchAndCacheValidators();
    }

    return this.validatorsView(cache);
  }

  private async fetchAndCacheValidators() {
    const { validators } = await this.okp4Service.getValidators();
    await this.cache.setValidators(validators);

    return this.validatorsView(validators);
  }

  private async validatorsView(
    toView: Validator[]
  ): Promise<ValidatorsViewDto[]> {
    const view = [];
    const globalOverview: GlobalStakedOverviewDto = await this.getGlobalOverview();

    for (const validator of toView) {
      const uptime = await this.calculateValidatorUptime(validator.operator_address);
      const votingPower = Big(validator.delegator_shares).div(globalOverview.totalStaked).toNumber();
      const logo = (await this.cache.getValidatorImg(validator.description.identity)) as string;

      view.push({
        logo,
        description: {
          moniker: validator.description.moniker,
          details: validator.description.details,
          securityContact: validator.description.security_contact,
          identity: validator.description.identity,
          website: validator.description.website,
        },
        address: validator.operator_address,
        status:
          validator.status === ValidatorStatus.BONDED
            ? ValidatorStatusView.BONDED
            : ValidatorStatusView.UN_BONDED,
        jailed: validator.jailed,
        stakedAmount: validator.delegator_shares,
        uptime: toPercents(uptime),
        votingPower: toPercents(votingPower),
        commission: {
          updateTime: validator.commission.update_time,
          rate: toPercents(validator.commission.commission_rates.rate),
          maxChangeRate: toPercents(validator.commission.commission_rates.max_change_rate),
          maxRate: toPercents(validator.commission.commission_rates.max_rate),
        },
      });
    }

    return view;
  }

  async getMyValidatorDelegation(payload: MyValidatorDelegationDto) {
    const cache = await this.cache.getValidatorDelegation(
      this.createValidatorDelegationHash(payload.address, payload.validatorAddress)
    );

    if (cache === null) {
      return this.fetchAndSaveMyValidatorDelegation(payload);
    }

    return cache;
  }

  private async fetchAndSaveMyValidatorDelegation(
    payload: MyValidatorDelegationDto
  ) {
    const rez = await Promise.all([
      this.fetchMyStakedAmount(payload.address, payload.validatorAddress),
      this.fetchDelegatorsRewards(payload.address, payload.validatorAddress),
    ]);

    const dto = {
      delegation: rez[0],
      earnings: rez[1],
    };

    await this.cache.setValidatorDelegation(
      this.createValidatorDelegationHash(payload.address, payload.validatorAddress),
      dto
    );

    return dto;
  }

  private createValidatorDelegationHash(address: string, validatorAddress: string) {
    const hash = createHash('sha256');
    hash.update(`${address}_${validatorAddress}`);
    return hash.digest('hex');
  }

  async getValidatorDelegations(payload: ValidatorDelegationsDto) {
    const res = await this.okp4Service.getValidatorDelegations(
      payload.address,
      payload.limit,
      payload.offset
    );
    const validators: ValidatorsViewDto[] = await this.getValidators();
    const validator = validators.find(
      (validator) => validator.address === payload.address
    );
    const validatorDelegations = this.validatorDelegationView(
      res.delegation_responses,
      validator!.commission.rate
    );

    return {
      validatorDelegations,
      pagination: {
        total: res.pagination.total,
        limit: payload.limit === undefined ? null : payload.limit,
        offset: payload.offset === undefined ? null : payload.offset,
      },
    };
  }

  private validatorDelegationView(
    toView: Delegation[],
    validatorCommission: string
  ) {
    return toView.map((delegation) => ({
      delegator: delegation.delegation.delegator_address,
      delegatedAmount: delegation.balance.amount,
      commission: validatorCommission,
    }));
  }

  private async loadAndCacheValidatorImages() {
    try {
      const { validators } = await this.okp4Service.getValidators();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let promises: any = [];
      validators.forEach((validator) =>
        promises.push(
          this.keybaseService.getUserLookup(validator.description.identity)
        )
      );
      const rez: UserLookupResponse[] = await Promise.all(promises);
      promises = [];
      for (let i = 0; i < validators.length; i++) {
        const validator = validators[i];
        const imgUrl = rez[i]?.them[0]?.pictures?.primary?.url || "";
        promises.push(
          this.cache.setValidatorImg(validator.description.identity, imgUrl)
        );
      }
      await Promise.all(promises);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      Log.warn("Failed to load validator image " + e.message);
    }
  }

  async getValidatorByAddress(address: string) {
    const validators: ValidatorsViewDto[] = await this.getValidators();
    const validator = validators.find(
      (validator) => validator.address === address
    );

    if (!validator) {
      throw new BadRequestException(StakingError.VALIDATOR_ADDRESS_NOT_EXISTS);
    }

    return validator;
  }

  async newBlock(res: BlocksResponse) {
    try {
      // Create a map of validator addresses to their public keys
      const mapValidatorAddrToPubkey =
        await this.createValidatorAddrToPubkeyMap();
      const signatureToAddressMap = new Map();

      // Cache the latest block view
      const blockView = this.blockView(res);
      await this.cache.setLastBlock(blockView);

      // Process each signature in the block's last commit
      for (const signature of res.block.last_commit.signatures) {
        const validatorAddress = mapValidatorAddrToPubkey.get(
          signature.validator_address
        );

        if (validatorAddress) {
          const signatureView = this.signatureView(signature, validatorAddress);

          // Check if the signature is from the proposer of the block
          if (
            signature.validator_address === res.block.header.proposer_address
          ) {
            signatureView.status = SignatureViewStatus.PROPOSED;

            // Cache the recently proposed block and emit an event
            await this.cache.setRecentlyProposedBlock(
              validatorAddress,
              blockView
            );
            this.eventEmitter.emit(
              Event.BLOCK_CACHED,
              validatorAddress,
              blockView
            );
          }

          // Update the signature to address map and cache the validator's signatures
          signatureToAddressMap.set(validatorAddress, signatureView);
          await this.cache.setValidatorSignatures(
            validatorAddress,
            signatureView
          );
        }
      }

      // Handle validators who missed signing the block
      for (const address of mapValidatorAddrToPubkey.values()) {
        if (!signatureToAddressMap.has(address)) {
          const missedSignatureView = this.missedSignatureView(address);

          // Update the map and cache the missed signature
          signatureToAddressMap.set(address, missedSignatureView);
          await this.cache.setValidatorSignatures(address, missedSignatureView);
        }
      }

      // Emit an event after caching all signatures
      this.eventEmitter.emit(Event.SIGNATURES_CACHED, signatureToAddressMap);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      Log.warn(`New block error: ${e.message}`);
    }
  }

  private blockView(res: BlocksResponse) {
    return {
      height: res.block.last_commit.height,
      blockHash: res.block.last_commit.block_id.hash,
      txs: String(res.block.data.txs.length),
      time: new Date(),
    };
  }

  private missedSignatureView(addr: string) {
    return {
      status: SignatureViewStatus.MISSED,
      address: addr,
      timestamp: "",
      signature: "",
    };
  }

  private signatureView(signature: Signature, address: string) {
    return {
      status: SignatureViewStatus.SIGNED,
      address,
      timestamp: signature.timestamp,
      signature: signature.signature,
    };
  }

  private async createValidatorAddrToPubkeyMap() {
    const map = new Map();
    await this.fetchAndCacheValidators();
    const validators = await this.cache.getValidators() as Validator[];

    if(!validators) {
      Log.warn('Validators list empty');
    }

    for (const validator of validators) {
      const pubkey = this.okp4Service
        .wssPubkeyToAddr(validator.consensus_pubkey.key)
        .toUpperCase();
      map.set(pubkey, validator.operator_address);
    }

    return map;
  }

  private async calculateValidatorUptime(address: string) {
    const blocks: Signature[] = await this.cache.getValidatorSignatures(
      address
    );
    const signed = blocks.reduce((acc, block) => {
      if (block && block.signature) {
        acc += 1;
      }
      return acc;
    }, 0);
    if (!blocks?.length || !signed) {
      return 0;
    }
    return Big(blocks.length).div(signed).toNumber();
  }

  async getValidatorUptime(address: string) {
    const signatures = await this.getSortedValidatorSignatures(address);
    const current = await this.getLastBlockHeight();

    return {
      blocks: signatures,
      current,
    };
  }

  async getValidatorRecentlyProposedBlocks(address: string) {
    const recentlyProposedBlocks = await this.getSortedRecentlyProposedBlocks(
      address
    );
    return {
      recentlyProposedBlocks,
      total: recentlyProposedBlocks.length,
    };
  }

  private async getLastBlockHeight() {
    const lastBlock = await this.cache.getLastBlock();
    return lastBlock?.height || 0;
  }

  private async getSortedRecentlyProposedBlocks(address: string) {
    try {
      const recentlyBlocks: RecentlyProposedBlockDto[] =
        await this.cache.getRecentlyProposedBlock(address);
      return recentlyBlocks.sort(
        (a, b) => Number.parseFloat(b.height) - Number.parseFloat(a.height)
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      Log.warn(
        "Cache recently proposed blocks deserialization error " + e.message
      );
    }

    return [];
  }

  private async getSortedValidatorSignatures(address: string) {
    try {
      const signatures: SignatureDto[] =
        await this.cache.getValidatorSignatures(address);
      return signatures
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, 60);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      Log.warn("Cache signatures deserialization error " + e.message);
    }

    return [];
  }

  private async fetchProposals() {
    const proposals = await this.okp4Service.getProposals();
    const proposalsWithTurnout = [];

    for (const proposal of proposals.proposals) {
      const quorum = await this.calculateQuorum(proposal);
      proposalsWithTurnout.push({
        ...proposal,
        turnout: quorum,
      });
    }

    const view = {
      pagination: proposals.pagination,
      proposals: proposalsWithTurnout,
    };

    await this.cache.setProposals(view);

    return view;
  }

  async getProposals() {
    const cache = await this.cache.getProposals();

    if (cache === null) {
      return this.fetchProposals();
    }

    return cache;
  }

  private async fetchProposal(proposalId: string | number) {
    const proposal = await this.okp4Service.getProposal(proposalId);
    const proposalVote = await this.fetchProposalVote(proposal.proposal);
    const proposalWithVote = {
      pagination: proposal.pagination,
      proposal: {
        ...proposal.proposal,
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
