import { Routes } from "@core/enums/routes.enum";
import { Controller, Get, Query } from "@nestjs/common";
import { TokenCache } from "./services/token.cache";
import { TokenEndpoint } from "./enums/token-endpoint.enum";
import { QueryParam } from "@core/enums/query-param.enum";
import { SchemaValidatePipe } from "@core/pipes/schema-validate.pipe";
import { Range } from "@core/enums/range.enum";
import { RangeSchema } from "@core/schemas/range.schema";

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
    @Query(QueryParam.RANGE, new SchemaValidatePipe(RangeSchema))
      range: Range,
  ) {
    return this.cache.getTokenHistoricalPrice(range);
  }
}