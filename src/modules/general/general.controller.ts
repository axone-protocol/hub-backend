import { Controller, Get } from "@nestjs/common";
import { GeneralService } from "./general.service";
import { Routes } from "@core/enums/routes.enum";

@Controller(Routes.GENERAL)
export class GeneralController {
  constructor(private readonly generalService: GeneralService) {}

  @Get("exchange-rate")
  async getExchangeRate() {
    return this.generalService.getExchangeRate();
  }
}
