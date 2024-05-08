import { Controller, Get, Query } from '@nestjs/common';

import { Routes } from '@core/enums/routes.enum';
import { SchemaValidatePipe } from '@core/pipes/schema-validate.pipe';
import { Range } from '@core/enums/range.enum';

import { QueryParam } from './enums/query-param.enum';
import { RangeSchema } from './schemas/range.schema';
import { PriceCache } from './services/price.cache';
import { PriceEndpoints } from './enums/price-endpoints.enum';

@Controller(Routes.PRICE)
export class PriceController {
  constructor(private readonly cache: PriceCache) {}

  @Get(PriceEndpoints.HISTORICAL)
  async getHistoricalPrice(
    @Query(QueryParam.RANGE, new SchemaValidatePipe(RangeSchema))
    range: Range,
  ) {
    return this.cache.getCacheByRange(range);
  }
}
