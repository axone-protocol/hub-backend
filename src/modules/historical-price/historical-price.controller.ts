import { Controller, Get, Query } from '@nestjs/common';

import { Routes } from '@core/enums/routes.enum';
import { SchemaValidatePipe } from '@core/pipes/schema-validate.pipe';

import { QueryParam } from './enums/query-param.enum';
import { Range } from './enums/range.enum';
import { RangeSchema } from './schemas/range.schema';
import { HistoricalPriceCache } from './services/historical-price.cache';

@Controller(Routes.HISTORICAL_PRICE)
export class HistoricalPriceController {
  constructor(private readonly cache: HistoricalPriceCache) {}

  @Get()
  async getHistoricalPrice(
    @Query(QueryParam.RANGE, new SchemaValidatePipe(RangeSchema))
    range: Range,
  ) {
    return this.cache.getCacheByRange(range);
  }
}
