import { Okp4Service } from "@core/lib/okp4/okp4.service";
import { Module } from "@nestjs/common";
import { StackingService } from "./services/stacking.service";
import { StackingController } from "./stacking.controller";
import { HttpService } from "@core/lib/http.service";
import { StackingCache } from "./services/stacking.cache";
import { OsmosisService } from "@core/lib/osmosis/osmosis.service";

@Module({
  imports: [],
  providers: [
    Okp4Service,
    OsmosisService,
    StackingService,
    StackingCache,
    HttpService,
  ],
  controllers: [
    StackingController,
  ],
})
export class StackingModule {}