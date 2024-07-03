import { Range } from '@core/enums/range.enum';
import * as Joi from 'joi';

export const RangeSchema = Joi.string()
  .valid(...Object.values(Range))
  .required();