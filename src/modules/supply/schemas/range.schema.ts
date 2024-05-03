import * as Joi from 'joi';
import { SupplyRange } from '../enums/supply-range.enum';

export const RangeSchema = Joi.string()
  .valid(...Object.values(SupplyRange))
  .required();
