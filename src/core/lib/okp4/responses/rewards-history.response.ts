import { WithPaginationResponse } from "./with-pagination.response";

export type RewardsHistoryResponse = WithPaginationResponse<{
    tx_responses: Tx[];
}>;


export interface Tx {
    txhash: string;
    code: number;
    timestamp: string;
    tx: {
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