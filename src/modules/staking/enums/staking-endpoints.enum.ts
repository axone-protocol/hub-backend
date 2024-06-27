export enum StakingEndpoints {
  MY_OVERVIEW = '/my/overview',
  MY_VALIDATOR_DELEGATION = '/my/validator-delegation',
  VALIDATOR_DELEGATIONS = '/validator-delegations',
  OVERVIEW = '/overview',
  VALIDATORS = '/validators',
  VALIDATORS_BY_ADDRESS = '/validators/:address',
  VALIDATORS_UPTIME = '/validators/:address/uptime',
  VALIDATORS_RECENTLY_PROPOSED_BLOCKS = '/validators/:address/recently-proposed-blocks',
  PROPOSALS = '/proposals',
  PROPOSAL = '/proposals/:proposal_id',
  PROPOSAL_VOTERS = '/proposals/:proposal_id/voters',
}
