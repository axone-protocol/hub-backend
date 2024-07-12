import { Okp4Service } from "@core/lib/okp4/okp4.service";
import { Injectable } from "@nestjs/common";
import { GetBalancesDto } from "./dtos/get-balances.dto";
import { GetWalletRewardsHistoryDto } from "./dtos/get-wallet-rewards-history.dto";
import { Tx } from "@core/lib/okp4/responses/rewards-history.response";
import { extractNumbers } from "@utils/exctract-numbers";
import { WalletCache } from "./wallet-cache";
import { hash } from "@utils/create-hash";
import Big from "big.js";

@Injectable()
export class WalletService {
  constructor(private readonly okp4Service: Okp4Service, private readonly cache: WalletCache) {}

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

  async getWalletRewardsHistory(payload: GetWalletRewardsHistoryDto) {
    const cache = await this.cache.getWalletRewardHistory(hash(payload));

    if(!cache) {
      return this.fetchAndCacheRewardsHistory(payload);
    }

    return cache;
  }

  private async fetchAndCacheRewardsHistory({ address, limit, offset }: GetWalletRewardsHistoryDto) {
    const res = await this.okp4Service.getWalletRewardsHistory(address, limit, offset);
    const historyView = res.tx_responses.map(tx => this.walletRewardHistoryView(tx));
    const pagination = {
      total: +res.total,
      limit: limit === undefined ? null : limit,
      offset: offset === undefined ? null : offset,
    };
    await this.cache.setWalletRewardHistory(hash({ address, limit, offset }), {
      history: historyView,
      pagination,
    });
    return {
      history: historyView,
      pagination,
    };
  }

  private walletRewardHistoryView(tx: Tx) {
    const coinSpentAmount = tx.events.reduce((acc, event) => {
      if(event.type === 'coin_spent') {
        const amountWithDenom = event.attributes.find(attribute => attribute.key === 'amount');
        if(amountWithDenom) {
          acc = acc + extractNumbers(amountWithDenom?.value)[0];
        }
      }
      return acc;
    }, 0);
    const feeAmount = tx.tx.auth_info.fee.amount.reduce((acc, fee) => {
      acc = acc + +fee.amount;
      return acc;
    }, 0);
    const messages = tx.tx.body.messages.map(message => {
      const splitted = message["@type"].split('.');
      return splitted[splitted.length - 1];
    });

    return {
      txHash: tx.txhash,
      result: tx.code ? 'Failed' : 'Success',
      messages,
      amount: Big(coinSpentAmount).minus(feeAmount).div(1_000_000).toString(),
      time: tx.timestamp
    }
  }
}
