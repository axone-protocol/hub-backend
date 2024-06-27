import * as Joi from "joi";

export const GetProposalVotersSchema = Joi.object({
  limit: Joi.number().optional(),
  offset: Joi.number().optional(),
})
  .keys()
  .and("limit", "offset")
  .required();
