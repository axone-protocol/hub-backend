import * as Joi from 'joi';

export const ConfigSchema = Joi.object({
  MODE: Joi.string().required(),
  HOST: Joi.string().required(),
  PORT: Joi.number().required(),
  TOKEN_NAME: Joi.string().required(),
  OSMOSIS_BASE_URL: Joi.string().required(),
  DATABASE_URL: Joi.string().required(),
  OKP4_BASE_URL: Joi.string().required(),
  TOKEN_DENOM: Joi.string().required(),
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.string().required(),
  MY_STAKING_OVERVIEW: Joi.number().required(),
  GLOBAL_STAKING_OVERVIEW: Joi.number().required(),
}).required();
