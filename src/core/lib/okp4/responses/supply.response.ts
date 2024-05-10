import { WithPaginationResponse } from "./with-pagination.response";

export type SupplyResponse = WithPaginationResponse<{ supply: Supply[] }>;

export interface Supply {
  denom: string;
  amount: string;
}