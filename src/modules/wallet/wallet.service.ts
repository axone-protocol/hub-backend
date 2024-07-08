import { Okp4Service } from "@core/lib/okp4/okp4.service";
import { Injectable } from "@nestjs/common";
import { GetBalancesDto } from "./dtos/get-balances.dto";
import { GetWalletRewardsHistoryDto } from "./dtos/get-wallet-rewards-history.dto";
import { Tx } from "@core/lib/okp4/responses/rewards-history.response";
import { extractNumbers } from "@utils/exctract-numbers";
import { WalletCache } from "./wallet-cache";
import { hash } from "@utils/create-hash";

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
    await this.cache.setWalletRewardHistory(hash({ address, limit, offset }), historyView);
    return historyView;
  }

  private walletRewardHistoryView(tx: Tx) {
    const coinSpendEvent = tx.events.find(event => event.type === 'coin_spent');
    const messages = tx.tx.body.messages.map(message => {
      const splitted = message["@type"].split('.');
      return splitted[splitted.length - 1];
    });
    let amount = 0;

    if(coinSpendEvent) {
      const amountAttribute = coinSpendEvent.attributes.find(attribute => attribute.key === 'amount');
      amountAttribute && (amount = extractNumbers(amountAttribute?.value)[0]);
    }

    return {
      txHash: tx.txhash,
      result: tx.code ? 'Success' : 'Failed',
      messages,
      amount,
      time: tx.timestamp
    }
  }
}
