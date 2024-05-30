import { Module } from "@nestjs/common";
import { GovernanceController } from "./governance.controller";
import { GovernanceCache } from "./governance.cache";
import { GovernanceService } from "./governance.service";
import { RedisService } from "@core/lib/redis.service";
import { Okp4Service } from "@core/lib/okp4/okp4.service";
import { HttpService } from "@core/lib/http.service";

@Module({
  controllers: [GovernanceController],
  providers: [
    RedisService,
    GovernanceCache,
    GovernanceService,
    Okp4Service,
    HttpService,
  ]
})
export class GovernanceModule {}