import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { SupplyService } from "./supply.service";

@Injectable()
export class SupplyJobs {
  constructor(
    private readonly service: SupplyService,
  ) { }
    
  @Cron('* * * * *')
  async fetchNewPrice() {
    await this.service.fetchAndSaveCurrentSupply();
    await this.service.initSupplyHistoricalCache();
  }
}