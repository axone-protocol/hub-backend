import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { HistoricalPriceModule } from './historical-price/historical-price.module';

@Module({
  imports: [ScheduleModule.forRoot(), HistoricalPriceModule],
})
export class AppModule {}
