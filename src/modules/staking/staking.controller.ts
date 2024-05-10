import { Routes } from "@core/enums/routes.enum";
import { Controller, Get, Query } from "@nestjs/common";
import { StakingService } from "./services/staking.service";
import { StakingEndpoints } from "./enums/staking-endpoints.enum";
import { QueryParam } from "./enums/query-param.enum";
import { SchemaValidatePipe } from "@core/pipes/schema-validate.pipe";
import { AddressSchema } from "./schemas/address.schema";

@Controller(Routes.STAKING)
export class StakingController {
  constructor(
    private readonly service: StakingService,
  ) { }
    
  @Get(StakingEndpoints.MY_OVERVIEW)
  async getMyStakedOverview(
    @Query(QueryParam.ADDRESS, new SchemaValidatePipe(AddressSchema))
      address: string,
  ) {
    return await this.service.getMyStakedOverview(address);
  }

  @Get(StakingEndpoints.OVERVIEW)
  async getGlobalOverview() {
    return this.service.getGlobalOverview();
  }
}