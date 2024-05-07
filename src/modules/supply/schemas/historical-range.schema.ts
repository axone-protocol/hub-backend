import * as Joi from 'joi';
import { HistoricalSupplyRange } from '../enums/historical-supply-range.enum';

export const HistoricalRangeSchema = Joi.string()
  .valid(...Object.values(HistoricalSupplyRange))
  .required();