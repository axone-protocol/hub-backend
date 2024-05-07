import { Okp4Service } from "@core/lib/okp4/okp4.service";
import { Injectable } from "@nestjs/common";

import { StackingCache } from "./stacking.cache";

@Injectable()
export class StackingService {
    constructor(
        private readonly okp4Service: Okp4Service,
        private readonly cache: StackingCache,
    ) { }
    
    async getMyStacking(address: string) {
        const cache = await this.cache.getUserStacking(address);
        if (cache === null) {
            const amount = await this.getStackedAmountByAddress(address);
            await this.cache.cacheUserStacking(address, amount);
            return amount;
        }
        return cache;
    }

    async getStackedAmountByAddress(address: string) {
        const res = await this.okp4Service.getDelegations(address);
        return res.delegation_responses.reduce((acc, val) => acc + +val.balance.amount, 0);
    }
}