import { HttpService } from "@core/lib/http.service";
import { OsmosisService } from "@core/lib/osmosis/osmosis.service";
import { Module } from "@nestjs/common";
import { TokenService } from "./services/token.service";
import { TokenCache } from "./services/token.cache";
import { TokenJobs } from "./services/token.jobs";
import { PrismaService } from "@core/lib/prisma.service";
import { TokenController } from "./token.controller";
import { RedisService } from "@core/lib/redis.service";
import { Okp4Service } from "@core/lib/okp4/okp4.service";

@Module({
  imports: [],
  providers: [
    PrismaService,
    HttpService,
    OsmosisService,
    Okp4Service,
    TokenService,
    TokenCache,
    TokenJobs,
    RedisService,
  ],
  controllers: [TokenController],
})
export class TokenModule {}
