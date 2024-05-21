import { ConfigDto } from './config.dto';

export const config: ConfigDto = {
  app: {
    mode: process.env.MODE!,
    host: process.env.HOST!,
    port: process.env.PORT!,
    token: process.env.TOKEN_NAME!,
    tokenDenom: process.env.TOKEN_DENOM!,
  },
  osmosis: {
    url: process.env.OSMOSIS_BASE_URL!,
  },
  okp4: {
    url: process.env.OKP4_BASE_URL!,
  },
  redis: {
    host: process.env.REDIS_HOST!,
    port: +process.env.REDIS_PORT!
  },
  cache: {
    myStakingOverview: +process.env.MY_STAKING_OVERVIEW!,
    globalStakingOverview: +process.env.GLOBAL_STAKING_OVERVIEW!,
    validators: +process.env.STAKING_VALIDATORS!,
    validatorDelegation: +process.env.STAKING_VALIDATOR_DELEGATION!,
  },
  keybase: {
    url: process.env.KEYBASE_URL!,
  }
};
