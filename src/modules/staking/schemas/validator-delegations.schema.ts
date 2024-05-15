import * as Joi from 'joi';

export const ValidatorDelegationsSchema = Joi.object({
  address: Joi.string().required(),
  limit: Joi.number().optional(),
  offset: Joi.number().optional(),
})
  .keys()
  .and('limit', 'offset')
  .required();