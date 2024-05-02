import * as Joi from 'joi';

import { PriceRange } from '../enums/price-range.enum';

export const RangeSchema = Joi.string()
  .valid(...Object.values(PriceRange))
  .required();
