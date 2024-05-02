import { ConfigDto } from './config.dto';

export const config: ConfigDto = {
  app: {
    mode: process.env.MODE!,
    host: process.env.HOST!,
    port: process.env.PORT!,
    token: process.env.TOKEN_NAME!,
  },
  osmosis: {
    url: process.env.OSMOSIS_BASE_URL!,
  },
};
