import { Controller, Get } from "@nestjs/common";
import { GeneralService } from "./generl.service";

@Controller()
export class GeneralController {
  constructor(private readonly generalService: GeneralService) {}

  @Get("exchange-rate")
  async getExchangeRate() {
    return this.generalService.getExchangeRate();
  }
}
