import { Range } from '@core/enums/range.enum';
import * as Joi from 'joi';

export const GrowthRangeSchema = Joi.string().valid(Range.FIVE_MIN, Range.HOUR, Range.DAY, Range.WEEK, Range.MONTH).required();