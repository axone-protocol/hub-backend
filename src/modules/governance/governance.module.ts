import { Module } from "@nestjs/common";
import { GovernanceController } from "./governance.controller";
import { GovernanceCache } from "./services/governance.cache";
import { GovernanceService } from "./services/governance.service";
import { RedisService } from "@core/lib/redis.service";
import { Okp4Service } from "@core/lib/okp4/okp4.service";
import { HttpService } from "@core/lib/http.service";
import { GovernanceJobs } from "./services/governance.jobs";

@Module({
  controllers: [GovernanceController],
  providers: [
    RedisService,
    GovernanceCache,
    GovernanceService,
    Okp4Service,
    HttpService,
    GovernanceJobs,
  ]
})
export class GovernanceModule {}