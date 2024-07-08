import * as Joi from "joi";

export const GetWalletRewardsHistorySchema = Joi.object({
  address: Joi.string().required(),
})
