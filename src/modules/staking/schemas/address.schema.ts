import * as Joi from 'joi';

export const AddressSchema = Joi.string().regex(/^([0-9A-Za-z]{27,45})$/).required();