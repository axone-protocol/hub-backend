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
    port: process.env.REDIS_PORT!
  }
};
