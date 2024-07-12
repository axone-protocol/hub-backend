import { WithPaginationResponse } from "./with-pagination.response";

export type RewardsHistoryResponse = WithPaginationResponse<{
    tx_responses: Tx[];
    total: string;
}>;


export interface Tx {
    txhash: string;
    code: number;
    timestamp: string;
    tx: {
        auth_info: {
            fee: {
                amount: Array<{
                    denom: string;
                    amount: string;
                }>
            }
        },
        body: {
            messages: Array<{
                "@type": string
            }>;
        }
    };
    events: Event[];
}

export interface Event {
    type: string;
    attributes: [
        {
            key: string;
            value: string;
            index: string;
        },
        {
            key: string;
            value: string;
            index: string;
        }
    ]
}