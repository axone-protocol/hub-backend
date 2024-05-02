import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { PriceModule } from './price/price.module';
import { SupplyModule } from './supply/supply.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PriceModule,
    SupplyModule,
  ],
})
export class AppModule {}
