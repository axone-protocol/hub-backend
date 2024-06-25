import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { EventEmitterModule } from "@nestjs/event-emitter";

import { SupplyModule } from "./supply/supply.module";
import { StakingModule } from "./staking/staking.module";
import { TokenModule } from "./token/token.module";
import { GovernanceModule } from "./governance/governance.module";
import { WalletModule } from "./wallet/wallet.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    TokenModule,
    SupplyModule,
    StakingModule,
    GovernanceModule,
    WalletModule,
  ],
})
export class AppModule {}
