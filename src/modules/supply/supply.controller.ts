import { Routes } from "@core/enums/routes.enum";
import { Controller, Get, Query } from "@nestjs/common";
import { SupplyEndpoints } from "./enums/supply-endpoints.enum";
import { SupplyCache } from "./services/supply.cache";
import { QueryParam } from "./enums/query-param.enum";
import { SchemaValidatePipe } from "@core/pipes/schema-validate.pipe";
import { HistoricalRangeSchema } from "./schemas/historical-range.schema";
import { HistoricalSupplyRange } from "./enums/historical-supply-range.enum";
import { SupplyService } from "./services/supply.service";
import { ChangeRangeSchema } from "./schemas/change-range.schema";
import { ChangeSupplyRange } from "./enums/change-supply-range.enum";

@Controller(Routes.SUPPLY)
export class SupplyController {
    constructor(
        private readonly cache: SupplyCache,
        private readonly service: SupplyService,
    ) {}
    
    @Get(SupplyEndpoints.HISTORICAL)
    async getHistoricalSupply(
        @Query(QueryParam.RANGE, new SchemaValidatePipe(HistoricalRangeSchema))
        range: HistoricalSupplyRange,
    ) {
        return this.cache.getCacheByRange(range);
    }

    @Get()
    async getCurrentSupply() {
        return this.service.getSupplyByOrder();
    }

    @Get(SupplyEndpoints.CHANGE)
    async getSupplyChange(
        @Query(QueryParam.RANGE, new SchemaValidatePipe(ChangeRangeSchema))
        range: ChangeSupplyRange,
    ) {
        return this.service.getSupplyChange(range);
    }
}