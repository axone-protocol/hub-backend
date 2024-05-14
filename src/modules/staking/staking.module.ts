import { Okp4Service } from "@core/lib/okp4/okp4.service";
import { Module } from "@nestjs/common";
import { StakingService } from "./services/staking.service";
import { StakingController } from "./staking.controller";
import { HttpService } from "@core/lib/http.service";
import { StakingCache } from "./services/staking.cache";
import { OsmosisService } from "@core/lib/osmosis/osmosis.service";
import { KeybaseService } from "@core/lib/keybase/keybase.service";

@Module({
  imports: [],
  providers: [
    Okp4Service,
    OsmosisService,
    KeybaseService,
    StakingService,
    StakingCache,
    HttpService,
  ],
  controllers: [
    StakingController,
  ],
})
export class StakingModule {}