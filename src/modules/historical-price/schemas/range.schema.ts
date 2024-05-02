import * as Joi from 'joi';

import { Range } from '../enums/range.enum';

export const RangeSchema = Joi.string()
  .valid(...Object.values(Range))
  .required();
