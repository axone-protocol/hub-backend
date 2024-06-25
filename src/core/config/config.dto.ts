export interface ConfigDto {
  app: AppConfig;
  osmosis: OsmosisConfig;
  okp4: Okp4Config;
  redis: RedisConfig;
  cache: CacheConfig;
  keybase: KeybaseConfig;
  exchangeRate: {
    url: string;
    key: string;
  };
}

export interface AppConfig {
  mode: string;
  host: string;
  port: number;
  token: string;
  tokenDenom: string;
}

export interface OsmosisConfig {
  url: string;
}

export interface Okp4Config {
  url: string;
  wss: string;
}

export interface RedisConfig {
  host: string;
  port: number;
}

export interface CacheConfig {
  myStakingOverview: number;
  globalStakingOverview: number;
  validators: number;
  validatorDelegation: number;
  validatorSignature: number;
  proposals: number;
  proposal: number;
  supplyChange: number;
}

export interface KeybaseConfig {
  url: string;
}
