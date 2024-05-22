export interface BlocksResponse {
  block: {
    data: {
      txs: unknown[],
    },
    last_commit: {
      height: string;
      round: number;
      block_id: {
        hash: string;
        part_set_header: {
          total: number;
          hash: string
        }
      };
      signatures: Signature[];
    }
  }
}

export interface Signature {
  block_id_flag: string;
  validator_address: string;
  timestamp: string;
  signature: string;
}