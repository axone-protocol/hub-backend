import { Injectable } from '@nestjs/common';

import { config } from '@core/config/config';
import { DBOrder } from '@core/enums/db-order.enum';
import { OsmosisService } from '@core/lib/osmosis/osmosis.service';
import { HistoricalChartRes } from '@core/lib/osmosis/responses/historical-chart.response';
import { PrismaService } from '@core/lib/prisma.service';

@Injectable()
export class PriceService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly osmosisService: OsmosisService,
  ) {}

  async updateHistoryPrice() {
    const newPrices = await this.newHistoricalPrices();
    await this.prismaService.historicalPrices.createMany({
      data: newPrices,
    });
  }

  private async getLastHistoryPrice() {
    return this.prismaService.historicalPrices.findFirst({
      orderBy: {
        time: DBOrder.DESC,
      },
    });
  }

  private async fetchDefaultHistoricalChart() {
    const res = await this.osmosisService.getHistoricalChart({
      symbol: config.app.token,
      range: 5,
    });
    return this.historicalPriceView(res);
  }

  private async newHistoricalPrices() {
    const lastHistory = await this.getLastHistoryPrice();
    let historicalChart = await this.fetchDefaultHistoricalChart();
    if (lastHistory) {
      const index = historicalChart.findIndex(
        (chartData) => new Date(chartData.time) > new Date(lastHistory.time),
      );
      if (index !== -1) {
        historicalChart = historicalChart.slice(index);
      } else {
        historicalChart = [];
      }
    }

    return historicalChart;
  }

  private historicalPriceView(res: HistoricalChartRes) {
    return res.map((item) => ({
      time: new Date(item.time * 1000),
      price: item.close,
    }));
  }
}
