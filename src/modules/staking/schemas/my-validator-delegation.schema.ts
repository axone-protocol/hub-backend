import * as Joi from 'joi';

export const MyValidatorDelegationSchema = Joi.object({
  address: Joi.string().required(),
  validatorAddress: Joi.string().required(),
}).required()