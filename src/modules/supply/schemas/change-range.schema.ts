import * as Joi from 'joi';
import { ChangeSupplyRange } from '../enums/change-supply-range.enum';

export const ChangeRangeSchema = Joi.string()
  .valid(...Object.values(ChangeSupplyRange))
  .required();