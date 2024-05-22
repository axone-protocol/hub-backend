export enum Endpoints {
  SUPPLY_BY_DENOM = 'cosmos/bank/v1beta1/supply/by_denom',
  STAKING_DELEGATIONS = 'cosmos/staking/v1beta1/delegations',
  DELEGATORS_VALIDATORS = 'cosmos/staking/v1beta1/delegators/:delegator_addr/validators',
  DELEGATORS_REWARDS = 'cosmos/distribution/v1beta1/delegators/:delegator_addr/rewards',
  SPENDABLE_BALANCE = 'cosmos/bank/v1beta1/spendable_balances',
  VALIDATORS = 'cosmos/staking/v1beta1/validators',
  TOTAL_SUPPLY = 'cosmos/bank/v1beta1/supply',
  VALIDATOR_DELEGATIONS = 'cosmos/staking/v1beta1/validators/:validator_addr/delegations',
  BLOCKS_LATEST = 'cosmos/base/tendermint/v1beta1/blocks/latest',
  BLOCKS_BY_HEIGHT = 'cosmos/base/tendermint/v1beta1/blocks/:height',
}
