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

@Injectable()
export class StakingService implements OnModuleInit {
  constructor(
    private readonly okp4Service: Okp4Service,
    private readonly cache: StakingCache,
    private readonly osmosisService: OsmosisService,
    private readonly keybaseService: KeybaseService,
  ) { }

  async onModuleInit() {
    try {
      await this.loadAndCacheValidatorImages();
    } catch (e) {
      Log.warn("Some of images failed to load");
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

    return cache;
  }

  private async fetchAndCacheValidators() {
    const res = await this.okp4Service.getValidators();
    const formattedValidators = await this.validatorsView(res.validators);
    await this.cache.setValidators(formattedValidators);

    return formattedValidators;
  }

  private async validatorsView(toView: Validator[]): Promise<ValidatorsViewDto[]> {
    const view = [];
    for (const validator of toView) {
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
        uptime: 0,
        votingPower: 0,
        commission: {
          updateTime: validator.commission.update_time,
          rate: validator.commission.commission_rates.rate,
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
  }

  async getValidatorByAddress(address: string) {
    const validators: ValidatorsViewDto[] = await this.getValidators();
    const validator = validators.find(validator => validator.address === address);

    if (!validator) {
      throw new BadRequestException(StakingError.VALIDATOR_ADDRESS_NOT_EXISTS);
    }

    return validator;
  }
}