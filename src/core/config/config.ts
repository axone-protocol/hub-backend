import { ConfigDto } from "./config.dto";

export const config: ConfigDto = {
  app: {
    mode: process.env.MODE!,
    host: process.env.HOST!,
    port: +process.env.PORT!,
    token: process.env.TOKEN_NAME!,
    tokenDenom: process.env.TOKEN_DENOM!,
  },
  osmosis: {
    url: process.env.OSMOSIS_BASE_URL!,
  },
  okp4: {
    url: process.env.OKP4_BASE_URL!,
    wss: process.env.OKP4_WSS_URL!,
  },
  redis: {
    host: process.env.REDIS_HOST!,
    port: +process.env.REDIS_PORT!,
  },
  cache: {
    myStakingOverview: +process.env.MY_STAKING_OVERVIEW!,
    globalStakingOverview: +process.env.GLOBAL_STAKING_OVERVIEW!,
    validators: +process.env.STAKING_VALIDATORS!,
    validatorDelegation: +process.env.STAKING_VALIDATOR_DELEGATION!,
    validatorSignature: +process.env.VALIDATOR_SIGNATURE!,
    proposals: +process.env.PROPOSALS_CACHE_TTL!,
    proposal: +process.env.PROPOSAL_CACHE_TTL!,
    supplyChange: +process.env.SUPPLY_CHANGE_CACHE_TTL!,
    proposalVoters: +process.env.PROPOSAL_VOTERS_TTL!,
    validatorRecentlyProposedBlock: +process.env.VALIDATOR_RECENTLY_PROPOSED_BLOCK_TTL!,
    walletRewardHistory: +process.env.WALLET_REWARD_HISTORY_TTL!,
  },
  keybase: {
    url: process.env.KEYBASE_URL!,
  },
  exchangeRate: {
    url: process.env.EXCHANGE_RATE_BASE_URL!,
    key: process.env.EXCHANGE_RATE_API_KEY!,
  },
};
