import { Range } from '@core/enums/range.enum';
import * as Joi from 'joi';

export const HistoricalRangeSchema = Joi.string()
  .valid(Range.ALL, Range.DAY, Range.WEEK, Range.MONTH, Range.HOUR)
  .required();