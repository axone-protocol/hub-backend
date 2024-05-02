import { Okp4Service } from "@core/lib/okp4/okp4.service";
import { Module } from "@nestjs/common";
import { SupplyService } from "./services/supply.service";
import { SupplyController } from "./supply.controller";
import { PrismaService } from "@core/lib/prisma.service";
import { SupplyJobs } from "./services/supply.jobs";
import { SupplyCache } from "./services/supply.cache";

@Module({
    providers: [
        Okp4Service,
        SupplyService,
        PrismaService,
        SupplyJobs,
        SupplyCache,
    ],
    controllers: [SupplyController],
})
export class SupplyModule {}