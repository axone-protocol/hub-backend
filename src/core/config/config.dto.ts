export interface ConfigDto {
  app: AppConfig;
  osmosis: OsmosisConfig;
}

export interface AppConfig {
  mode: string;
  host: string;
  port: string;
  token: string;
}

export interface OsmosisConfig {
  url: string;
}
