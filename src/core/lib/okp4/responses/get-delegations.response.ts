export interface GetDelegationsResponse {
    delegation_responses: DelegationItem[];
}

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