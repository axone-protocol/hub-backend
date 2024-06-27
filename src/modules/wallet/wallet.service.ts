import { Okp4Service } from "@core/lib/okp4/okp4.service";
import { Injectable } from "@nestjs/common";
import { GetBalancesDto } from "./get-balances.dto";

@Injectable()
export class WalletService {
  constructor(private readonly okp4Service: Okp4Service) {}

  async getBalances(payload: GetBalancesDto) {
    const res = await this.okp4Service.getBalances(
      payload.address,
      payload.limit,
      payload.offset
    );

    return {
      balances: res.balances,
      pagination: {
        total: res.pagination.total,
        limit: payload.limit === undefined ? null : payload.limit,
        offset: payload.offset === undefined ? null : payload.offset,
      },
    };
  }
}
