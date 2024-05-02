import { Module } from '@nestjs/common';

import { OsmosisService } from '@core/lib/osmosis/osmosis.service';
import { PrismaService } from '@core/lib/prisma.service';

import { HistoricalPriceController } from './historical-price.controller';
import { HistoricalPriceCache } from './services/historical-price.cache';
import { HistoricalPriceJobs } from './services/historical-price.jobs';
import { HistoricalPriceService } from './services/historical-price.service';

@Module({
  imports: [],
  providers: [
    HistoricalPriceJobs,
    HistoricalPriceCache,
    HistoricalPriceService,
    PrismaService,
    OsmosisService,
  ],
  controllers: [HistoricalPriceController],
})
export class HistoricalPriceModule {}
