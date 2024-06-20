import { Routes } from "@core/enums/routes.enum";
import { Controller, Get, Query } from "@nestjs/common";
import { SupplyEndpoints } from "./enums/supply-endpoints.enum";
import { SupplyCache } from "./services/supply.cache";
import { QueryParam } from "./enums/query-param.enum";
import { SchemaValidatePipe } from "@core/pipes/schema-validate.pipe";
import { HistoricalRangeSchema } from "./schemas/historical-range.schema";
import { SupplyService } from "./services/supply.service";
import { ChangeRangeSchema } from "./schemas/change-range.schema";
import { Range } from "@core/enums/range.enum";
import { ChartsRangeSchema } from "./schemas/charts-range.schema";

@Controller(Routes.SUPPLY)
export class SupplyController {
  constructor(
    private readonly cache: SupplyCache,
    private readonly service: SupplyService,
  ) {}

  @Get(SupplyEndpoints.HISTORICAL)
  async getHistoricalSupply(
    @Query(QueryParam.RANGE, new SchemaValidatePipe(HistoricalRangeSchema))
      range: Range
  ) {
    return this.cache.getSupplyHistorical(range);
  }

  @Get()
  async getCurrentSupply() {
    return this.service.getSupplyByOrder();
  }

  @Get(SupplyEndpoints.CHANGE)
  async getSupplyChange(
    @Query(QueryParam.RANGE, new SchemaValidatePipe(ChangeRangeSchema))
      range: Range
  ) {
    return this.service.getSupplyChange(range);
  }

  @Get(SupplyEndpoints.CHARTS)
  async getCharts(
    @Query(QueryParam.RANGE, new SchemaValidatePipe(ChartsRangeSchema))
      range: Range
  ) {
    return this.service.getCharts(range);
  }
}
