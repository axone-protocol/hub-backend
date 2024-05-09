import { Injectable } from "@nestjs/common";
import Big from 'big.js';

import { config } from "@core/config/config";
import { DBOrder } from "@core/enums/db-order.enum";
import { Okp4Service } from "@core/lib/okp4/okp4.service";
import { PrismaService } from "@core/lib/prisma.service";

import { CurrentSupplyDto } from "../dtos/current-supply.dto";
import { Range } from "@core/enums/range.enum";

@Injectable()
export class SupplyService {
  constructor(
    private readonly okp4Service: Okp4Service,
    private readonly prismaService: PrismaService,
  ) { }
    
  async fetchAndSaveCurrentSupply() {
    try {
      const currentSupply = await this.fetchCurrentSupply();
      await this.prismaService.historicalSupply.create({
        data: currentSupply,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      throw new Error(e.message);
    }
  }

  private async fetchCurrentSupply(): Promise<CurrentSupplyDto> {
    const { amount: { amount: supply } } = await this.okp4Service.getSupplyByDenom(config.app.tokenDenom);
    const time = new Date();
    const change = await this.calculateSupplyChange(supply);

    return {
      time,
      supply,
      change,
    }
  }

  async getSupplyByOrder(order = DBOrder.DESC) {
    return this.prismaService.historicalSupply.findFirst({
      orderBy: {
        time: order,
      },
    });
  }

  private async calculateSupplyChange(newSupply: string) {
    const currentSupply = await this.getSupplyByOrder();
    let change = 0;

    if (currentSupply && newSupply) {
      if (Number.parseFloat(currentSupply.supply) === 0) {
        change = Big(newSupply).toNumber();
      } else {
        change = Big(newSupply).minus(currentSupply.supply).div(currentSupply.supply).toNumber();
      }
    }
        
    return change;
  }

  async getSupplyChange(range: Range) {
    const previousSupply = await this.getPastSupplyByRange(range);
    const currentSupply = await this.getSupplyByOrder();
    if (previousSupply && currentSupply) return Big(currentSupply.supply).minus(previousSupply.supply);
  }

  private async getPastSupplyByRange(range: Range) {
    const dateByRange = this.calculatePastDateByRange(range);
    const supply = await this.prismaService.historicalSupply.findFirst({
      where: {
        time: {
          lte: dateByRange,
        }
      },
      orderBy: {
        time: DBOrder.DESC
      },
    });

    if (!supply) {
      return this.getSupplyByOrder(DBOrder.ASC);
    }

    return supply;
  }

  private calculatePastDateByRange(range: Range): Date {
    let date = new Date();
    switch (range) {
      case Range.FIVE_MIN: date = new Date(date.setMinutes(date.getMinutes() - 5)); break;
      case Range.HOUR: date = new Date(date.setHours(date.getHours() - 1)); break;
      case Range.DAY: date = new Date(date.setDate(date.getDate() - 1)); break;
      case Range.WEEK: date = new Date(date.setDate(date.getDate() - 7)); break;
      case Range.MONTH: date = new Date(date.setMonth(date.getMonth() - 1)); break;
    }

    return date;
  }

  async getSupplyGrowth(range: Range) {
    const pastDate = this.calculatePastDateByRange(range);
    const supplyChangeByPeriod = await this.prismaService.historicalSupply.aggregate({
      where: {
        time: {
          gte: pastDate,
        }
      },
      _sum: {
        change: true,
      }
    });

    if (supplyChangeByPeriod._sum.change) {
      return Big(supplyChangeByPeriod._sum.change).toFixed(2);
    }

    return 0;
  }
}