import { WithPaginationResponse } from "./with-pagination.response";

export type SpendableBalancesResponse = WithPaginationResponse<{ balances: Balance[] }>;

export interface Balance {
  denom: string;
  amount: string;
}