import { Okp4Service } from "@core/lib/okp4/okp4.service";
import { BadRequestException, Injectable, OnModuleInit } from "@nestjs/common";

import { StakingCache } from "./staking.cache";
import { config } from "@core/config/config";
import { MyStakedOverviewDto } from "../dtos/my-staked-overview.dto";
import { OsmosisService } from "@core/lib/osmosis/osmosis.service";
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
import { BlocksResponse, Signature } from "@core/lib/okp4/responses/blocks.response";
import { Event } from "@core/enums/event.enum";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { toPercents } from "@utils/to-percents";
import { RecentlyProposedBlockDto } from "../dtos/recently-proposed-block.dto";
import { SignatureDto } from "../dtos/signature.dto";
import { SignatureViewStatus } from "../enums/signature-view-status.enum";

@Injectable()
export class StakingService implements OnModuleInit {
  constructor(
    private readonly okp4Service: Okp4Service,
    private readonly cache: StakingCache,
    private readonly osmosisService: OsmosisService,
    private readonly keybaseService: KeybaseService,
    private eventEmitter: EventEmitter2,
  ) { }

  async onModuleInit() {
    try {
      await this.loadAndCacheValidatorImages();
      await this.okp4Service.connectToNewBlockSocket(Event.BLOCK_UPDATE);
      this.eventEmitter.on(Event.BLOCK_UPDATE, (blocks: BlocksResponse) => this.newBlock(blocks));
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
    }

    await this.cache.setMyStakedOverview(address, myStakedOverviewDto);
    return myStakedOverviewDto;
  }

  private async fetchMyStakedAmount(address: string, validatorAddress?: string) {
    const res = await this.okp4Service.getDelegations(address);
    return res.delegation_responses.reduce((acc, val) => {
      if (validatorAddress && val.delegation.validator_address !== validatorAddress) {
        return acc;
      }

      return acc + +val.balance.amount;
    }, 0).toString();
  }

  private async fetchDelegatorsValidatorsAmount(address: string) {
    const res = await this.okp4Service.getDelegatorsValidators(address);
    return res.pagination.total;
  }

  private async fetchDelegatorsRewards(address: string, validatorAddress?: string) {
    const res = await this.okp4Service.getDelegatorsRewards(address);
    return res.rewards.reduce((acc, val) => {
      if (validatorAddress && val.validator_address !== validatorAddress) {
        return acc;
      }
      return acc + +(val.reward.find(({ denom }) => config.app.tokenDenom === denom)?.amount || 0)
    }, 0).toString();
  }

  private async fetchAvailableBalance(address: string) {
    const res = await this.okp4Service.getSpendableBalances(address);
    return res.balances.find(({ denom }) => config.app.tokenDenom === denom)?.amount || '0';
  }

  async getGlobalOverview() {
    const cache = await this.cache.getGlobalStakedOverview();

    if (cache === null) {
      return this.fetchAndCacheGlobalStakedOverview();
    }

    return cache;
  }

  private async fetchAndCacheGlobalStakedOverview(): Promise<GlobalStakedOverviewDto> {
    const rez = await Promise.all([
      this.okp4Service.getBondValidators(),
      this.osmosisService.getStakingApr(),
      this.fetchTotalSupply(),
    ]);

    const totalStaked = this.calculateTotalStaked(rez[0].validators);

    const dto: GlobalStakedOverviewDto = {
      totalValidators: rez[0].pagination.total,
      apr: rez[1].toString(),
      totalStaked,
      bondedTokens: Big(totalStaked).div(rez[2]!.amount).toString(),
    }

    await this.cache.setGlobalStakedOverview(dto);

    return dto;
  }

  private calculateTotalStaked(validators: Validator[]): string {
    const totalStaked = validators.reduce((acc, val) => acc.add(val.delegator_shares), Big(0));
    return totalStaked.toString();
  }

  private async fetchTotalSupply() {
    const res = await this.okp4Service.getTotalSupply();
    return res.supply.find(({ denom }) => denom === config.app.tokenDenom);
  }

  async getValidators() {
    const cache = await this.cache.getValidators();

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

  private async validatorsView(toView: Validator[]): Promise<ValidatorsViewDto[]> {
    const view = [];
    const globalOverview: GlobalStakedOverviewDto = await this.getGlobalOverview();

    for (const validator of toView) {
      const uptime = await this.calculateValidatorUptime(validator.operator_address);
      const votingPower = Big(validator.delegator_shares).div(globalOverview.totalStaked).toNumber();
      const logo = await this.cache.getValidatorImg(validator.description.identity) as string;
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
        status: validator.status === ValidatorStatus.BONDED ? ValidatorStatusView.BONDED : ValidatorStatusView.UN_BONDED,
        jailed: validator.jailed,
        stakedAmount: validator.delegator_shares,
        uptime: toPercents(uptime),
        votingPower: toPercents(votingPower),
        commission: {
          updateTime: validator.commission.update_time,
          rate: toPercents(validator.commission.commission_rates.rate),
          maxChangeRate: validator.commission.commission_rates.max_change_rate,
          maxRate: validator.commission.commission_rates.max_rate,
        },
      });
    }
    return view;
  }

  async getMyValidatorDelegation(payload: MyValidatorDelegationDto) {
    const cache = await this.cache.getValidatorDelegation(payload.address, payload.validatorAddress);

    if (cache === null) {
      return this.fetchAndSaveMyValidatorDelegation(payload);
    }

    return cache;
  }

  private async fetchAndSaveMyValidatorDelegation(payload: MyValidatorDelegationDto) {
    const rez = await Promise.all([
      this.fetchMyStakedAmount(payload.address, payload.validatorAddress),
      this.fetchDelegatorsRewards(payload.address, payload.validatorAddress),
    ]);

    const dto = {
      delegation: rez[0],
      earnings: rez[1],
    };
    
    await this.cache.setValidatorDelegation(payload.address, payload.validatorAddress, dto);

    return dto;
  }

  async getValidatorDelegations(payload: ValidatorDelegationsDto) {
    const res = await this.okp4Service.getValidatorDelegations(payload.address, payload.limit, payload.offset);
    const validators: ValidatorsViewDto[] = await this.getValidators();
    const validator = validators.find((validator) => validator.address === payload.address);
    const validatorDelegations = this.validatorDelegationView(res.delegation_responses, validator!.commission.rate);

    return {
      validatorDelegations,
      pagination: {
        total: res.pagination.total,
        limit: payload.limit || null,
        offset: payload.offset || null,
      }
    }
  }

  private validatorDelegationView(toView: Delegation[], validatorCommission: string) {
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
      validators.forEach(validator => promises.push(this.keybaseService.getUserLookup(validator.description.identity)));
      const rez: UserLookupResponse[] = await Promise.all(promises);
      promises = [];
      for (let i = 0; i < validators.length; i++) {
        const validator = validators[i];
        const imgUrl = rez[i]?.them[0]?.pictures?.primary?.url || '';
        promises.push(this.cache.setValidatorImg(validator.description.identity, imgUrl));
      }
      await Promise.all(promises);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      Log.warn("Failed to load validator image " + e.message);
    }
  }

  async getValidatorByAddress(address: string) {
    const validators: ValidatorsViewDto[] = await this.getValidators();
    const validator = validators.find(validator => validator.address === address);

    if (!validator) {
      throw new BadRequestException(StakingError.VALIDATOR_ADDRESS_NOT_EXISTS);
    }

    return validator;
  }

  async newBlock(res: BlocksResponse) {
    try {
      await this.cacheSignatures(res.block.last_commit.signatures, res.block.header.proposer_address);
      await this.cacheBlock(res);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      Log.warn("New block error " + e.message);
    }
  }
  
  private async cacheBlock(res: BlocksResponse) {
    try {
      await this.cache.setRecentlyProposedBlock({
        height: res.block.last_commit.height,
        blockHash: res.block.last_commit.block_id.hash,
        txs: res.block.data.txs.length,
        time: new Date(),
      });
      this.eventEmitter.emit(Event.BLOCK_CACHED);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      Log.warn("Failed to cache recently proposed block " + e.message);
    }
  }

  private async cacheSignatures(signatures: Signature[], validatorProposedAddr: string) {
    try {
      const mapValidatorAddrToPubkey = new Map();
      await this.fillValidatorAddrToPubkey(mapValidatorAddrToPubkey);
      const signatureToAddressMap = new Map();

      for (const signature of signatures) {
        const addr = mapValidatorAddrToPubkey.get(signature.validator_address);
        if (addr) {
          const signatureView = this.signatureView(signature, mapValidatorAddrToPubkey.get(validatorProposedAddr));
          const value = signatureToAddressMap.get(addr) || [];
          value.push(signatureView);
          signatureToAddressMap.set(addr, value);
          await this.cache.setValidatorSignatures(addr, signatureView);
        }
      }

      this.eventEmitter.emit(Event.SIGNATURES_CACHED, signatureToAddressMap);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      Log.warn("Parse & cache signature error " + e.message);
    }
  }

  private signatureView(signature: Signature, proposedAddr?: string) {
    const status = signature.signature
      ? (proposedAddr && signature.validator_address === proposedAddr)
        ? SignatureViewStatus.PROPOSED
        : SignatureViewStatus.SIGNED
      : SignatureViewStatus.MISSED;

    return {
      status,
      address: signature.validator_address,
      timestamp: signature.timestamp,
      signature: signature.signature,
    }
  }

  private async fillValidatorAddrToPubkey(map: Map<string, string>) {
    await this.fetchAndCacheValidators();
    const validators: Validator[] = await this.cache.getValidators();

    for (const validator of validators) {
      const pubkey = this.okp4Service.wssPubkeyToAddr(validator.consensus_pubkey.key).toUpperCase();
      map.set(pubkey, validator.operator_address);
    }
  }

  private async calculateValidatorUptime(address: string) {
    const blocks: Signature[] = await this.cache.getValidatorSignatures(address);
    const signed = blocks.reduce((acc, block) => {
      if (block && block.signature) {
        acc += 1;
      }
      return acc;
    }, 0);
    if (!blocks || blocks.length === 0) {
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
    }
  }

  async getValidatorRecentlyProposedBlocks() {
    const recentlyProposedBlocks = await this.getSortedRecentlyProposedBlocks();
    return {
      recentlyProposedBlocks,
      total: recentlyProposedBlocks.length
    }
  }

  private async getLastBlockHeight() {
    const lastBlock = await this.getLastBlock();
    return lastBlock && lastBlock?.height || 0;
  }

  async getLastBlock() {
    const recentlyBlocks = await this.getSortedRecentlyProposedBlocks();
    return recentlyBlocks[0];
  }

  private async getSortedRecentlyProposedBlocks() {
    try {
      const recentlyBlocks: RecentlyProposedBlockDto[] = await this.cache.getRecentlyProposedBlock();
      return recentlyBlocks.sort((a, b) => Number.parseFloat(b.height) - Number.parseFloat(a.height)); 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch(e: any) {
      Log.warn("Cache recently proposed blocks deserialization error " + e.message);
    }

    return [];
  }

  private async getSortedValidatorSignatures(address: string) {
    try {
      const signatures: SignatureDto[] = await this.cache.getValidatorSignatures(address);
      return signatures
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 60);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      Log.warn("Cache signatures deserialization error " + e.message);
    }

    return [];
  }
}