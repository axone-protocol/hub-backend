import { WithPaginationResponse } from "./with-pagination.response";

export type ValidatorDelegationsResponse = WithPaginationResponse<{ delegation_responses: Delegation[] }>;

export interface Delegation {
  delegation: {
    delegator_address: string;
    validator_address: string;
    shares: string
  };
  balance: {
    denom: string;
    amount: string;
  }
}
