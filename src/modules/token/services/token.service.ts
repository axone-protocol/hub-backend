import { config } from "@core/config/config";
import { OsmosisService } from "@core/lib/osmosis/osmosis.service";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { TokenCache } from "./token.cache";
import { DBOrder } from "@core/enums/db-order.enum";
import { PrismaService } from "@core/lib/prisma.service";
import { TokenInfoDto } from "../dtos/token-info.dto";
import { HistoricalChartRes } from "@core/lib/osmosis/responses/historical-chart.response";
import Big from "big.js";

@Injectable()
export class TokenService implements OnModuleInit {
  constructor(
    private readonly osmosisService: OsmosisService,
    private readonly cache: TokenCache,
    private readonly prismaService: PrismaService,
  ) { }

  async onModuleInit() {
    await this.fetchAndSaveMcap();
    await this.fetchAndCacheTokenInfo();
  }
  
  async fetchAndCacheTokenInfo() {
    const res = (await this.osmosisService.getTokenInfo(config.app.token))[0];
    const mcap = await this.getMcapByOrder();
    const apr = await this.osmosisService.getStakingApr();

    const tokenInfoDto: TokenInfoDto = {
      price: {
        value: res.price,
        change: res.price_24h_change,
      },
      marketCap: {
        value: mcap!.mcap,
        change: mcap!.change,
      },
      volume: res.volume_24h,
      apr: apr.toString(),
    };

    await this.cache.cacheTokenInfo(tokenInfoDto);
  }

  async fetchAndSaveMcap() {
    const mcap = await this.fetchNewMcap();
    const change = await this.calculateMcapChange(mcap);

    await this.prismaService.historicalMcap.create({
      data: {
        time: new Date(),
        mcap,
        change,
      }
    });
  }

  private async fetchNewMcap(): Promise<number> {
    const mcaps = await this.osmosisService.getMcap();
    const tokenMcap = mcaps.find(({ symbol }) => symbol.toLowerCase() === config.app.token);
    return tokenMcap?.market_cap || 0;
  }

  private async calculateMcapChange(newMcap: number) {
    const currentMcap = await this.getMcapByOrder();
    let change = 0;

    if (currentMcap && newMcap) {
      if (currentMcap.mcap === 0) {
        change = Big(newMcap).toNumber();
      } else {
        change = Big(newMcap).minus(currentMcap.mcap).div(currentMcap.mcap).toNumber();
      }
    }
    
    return change;
  }

  private async getMcapByOrder(order = DBOrder.DESC) {
    return this.prismaService.historicalMcap.findFirst({
      orderBy: {
        time: order,
      },
    });
  }

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