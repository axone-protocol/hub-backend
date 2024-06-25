import { WithPaginationResponse } from "./with-pagination.response";

export type BalancesResponse = WithPaginationResponse<{
  balances: BalanceItem[];
}>;

export interface BalanceItem {
  denom: string;
  amount: string;
}
