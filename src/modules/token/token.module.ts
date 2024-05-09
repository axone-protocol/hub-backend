import { HttpService } from "@core/lib/http.service";
import { OsmosisService } from "@core/lib/osmosis/osmosis.service";
import { Module } from "@nestjs/common";
import { TokenService } from "./services/token.service";
import { TokenCache } from "./services/token.cache";
import { TokenJobs } from "./services/token.jobs";
import { PrismaService } from "@core/lib/prisma.service";
import { TokenController } from "./token.controller";

@Module({
  imports: [],
  providers: [
    PrismaService,
    HttpService,
    OsmosisService,
    TokenService,
    TokenCache,
    TokenJobs,
  ],
  controllers: [
    TokenController,
  ]
})
export class TokenModule {}