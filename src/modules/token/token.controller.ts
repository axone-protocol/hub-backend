import { Routes } from "@core/enums/routes.enum";
import { Controller, Get, Query } from "@nestjs/common";
import { TokenCache } from "./services/token.cache";
import { TokenEndpoint } from "./enums/token-endpoint.enum";
import { QueryParam } from "@core/enums/query-param.enum";
import { SchemaValidatePipe } from "@core/pipes/schema-validate.pipe";
import { HistoricalPriceRange } from "./schemas/historical-price-range.schema";
import { Range } from "@core/enums/range.enum";

@Controller(Routes.TOKEN)
export class TokenController {
  constructor(
    private readonly cache: TokenCache,
  ) { }

  @Get()
  async getTokenInfo() {
    return this.cache.getTokenInfo();
  }

  @Get(TokenEndpoint.HISTORICAL)
  async getHistoricalPrice(
    @Query(QueryParam.RANGE, new SchemaValidatePipe(HistoricalPriceRange))
      range: Range,
  ) {
    return this.cache.getCacheByRange(range);
  }
}