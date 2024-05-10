import { WithPaginationResponse } from "./with-pagination.response";

export type GetDelegationsResponse = WithPaginationResponse<{ delegation_responses: DelegationItem[] }>;

export interface DelegationItem {
    delegation: {
        delegator_address: string,
        validator_address: string,
        shares: string
    },
    balance: {
        denom: string,
        amount: string
    }
}