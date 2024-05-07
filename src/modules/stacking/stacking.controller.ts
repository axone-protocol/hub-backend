import { Routes } from "@core/enums/routes.enum";
import { Controller, Get, Query } from "@nestjs/common";
import { StackingService } from "./services/stacking.service";
import { StackingEndpoints } from "./enums/stacking-endpoints.enum";
import { QueryParam } from "./enums/query-param.enum";
import { SchemaValidatePipe } from "@core/pipes/schema-validate.pipe";
import { AddressSchema } from "./schemas/address.schema";

@Controller(Routes.STACKING)
export class StackingController {
    constructor(
        private readonly service: StackingService,
    ) { }
    
    @Get(StackingEndpoints.ME)
    async getMyStacking(
        @Query(QueryParam.ADDRESS, new SchemaValidatePipe(AddressSchema))
        address: string,
    ) {
        return this.service.getMyStacking(address);
    }
}