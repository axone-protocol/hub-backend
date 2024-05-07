export interface ConfigDto {
  app: AppConfig;
  osmosis: OsmosisConfig;
  okp4: Okp4Config;
  redis: RedisConfig;
  cache: CacheConfig;
}

export interface AppConfig {
  mode: string;
  host: string;
  port: string;
  token: string;
  tokenDenom: string;
}

export interface OsmosisConfig {
  url: string;
}

export interface Okp4Config {
  url: string;
}

export interface RedisConfig {
  host: string;
  port: string;
}

export interface CacheConfig {
  userStackingTtl: string;
}