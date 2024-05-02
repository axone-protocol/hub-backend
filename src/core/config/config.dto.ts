export interface ConfigDto {
  app: AppConfig;
  osmosis: OsmosisConfig;
  okp4: Okp4Config;
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
