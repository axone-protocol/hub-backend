import { Module } from '@nestjs/common';

import { OsmosisService } from '@core/lib/osmosis/osmosis.service';
import { PrismaService } from '@core/lib/prisma.service';

import { PriceController } from './price.controller';
import { PriceCache } from './services/price.cache';
import { PriceJobs } from './services/price.jobs';
import { PriceService } from './services/price.service';
import { HttpService } from '@core/lib/http.service';

@Module({
  providers: [
    PriceJobs,
    PriceCache,
    PriceService,
    PrismaService,
    OsmosisService,
    HttpService,
  ],
  controllers: [PriceController],
})
export class PriceModule {}
