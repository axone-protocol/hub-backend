import { Routes } from "@core/enums/routes.enum";
import { Controller, Get, Query } from "@nestjs/common";
import { SupplyEndpoints } from "./enums/supply-endpoints.enum";
import { SupplyCache } from "./services/supply.cache";
import { QueryParam } from "./enums/query-param.enum";
import { SchemaValidatePipe } from "@core/pipes/schema-validate.pipe";
import { RangeSchema } from "./schemas/range.schema";
import { SupplyRange } from "./enums/supply-range.enum";

@Controller(Routes.SUPPLY)
export class SupplyController {
    constructor(
        private readonly cache: SupplyCache,
    ) {}
    
    @Get(SupplyEndpoints.HISTORICAL)
    async getHistoricalSupply(
        @Query(QueryParam.RANGE, new SchemaValidatePipe(RangeSchema))
        range: SupplyRange,
    ) {
        return this.cache.getCacheByRange(range);
    }
}