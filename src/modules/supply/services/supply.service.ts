import { Injectable } from "@nestjs/common";
import Big from 'big.js';

import { config } from "@core/config/config";
import { DBOrder } from "@core/enums/db-order.enum";
import { Okp4Service } from "@core/lib/okp4/okp4.service";
import { PrismaService } from "@core/lib/prisma.service";

import { CurrentSupplyDto } from "../dtos/current-supply.dto";

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

    async getCurrentSupply() {
        return this.prismaService.historicalSupply.findFirst({
            orderBy: {
              time: DBOrder.DESC,
            },
        });
    }

    private async calculateSupplyChange(newSupply: string) {
        const currentSupply = await this.getCurrentSupply();
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
}