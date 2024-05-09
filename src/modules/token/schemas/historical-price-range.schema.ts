import * as Joi from 'joi';

import { Range } from '@core/enums/range.enum';

export const HistoricalPriceRange = Joi.string()
  .valid(Range.ALL, Range.DAY, Range.MONTH, Range.THREE_MONTH, Range.WEEK, Range.YEAR)
  .required();