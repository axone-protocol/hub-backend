import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { SupplyModule } from './supply/supply.module';
import { StakingModule } from './staking/staking.module';
import { TokenModule } from './token/token.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TokenModule,
    SupplyModule,
    StakingModule,
  ],
})
export class AppModule {}
