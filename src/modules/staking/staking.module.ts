import { Okp4Service } from "@core/lib/okp4/okp4.service";
import { Module } from "@nestjs/common";
import { StakingService } from "./services/staking.service";
import { StakingController } from "./staking.controller";
import { HttpService } from "@core/lib/http.service";
import { StakingCache } from "./services/staking.cache";
import { OsmosisService } from "@core/lib/osmosis/osmosis.service";
import { KeybaseService } from "@core/lib/keybase/keybase.service";
import { RedisService } from "@core/lib/redis.service";

@Module({
  imports: [],
  providers: [
    Okp4Service,
    OsmosisService,
    KeybaseService,
    RedisService,
    StakingService,
    StakingCache,
    HttpService,
  ],
  controllers: [
    StakingController,
  ],
})
export class StakingModule {}