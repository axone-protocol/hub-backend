import { WithPaginationResponse } from "./with-pagination.response"

export type GetProposalsResponse = WithPaginationResponse<{ proposals: Proposal[] }>;

export interface Proposal {
  id: string;
  messages: [
    {
      "@type": string;
      authority: string;
      params: {
        mint_denom: string;
        inflation_coef: string;
        blocks_per_year: string;
        inflation_max: unknown;
        inflation_min: unknown;
      }
    }
  ];
  status: string;
  final_tally_result: {
    yes_count: string;
    abstain_count: string;
    no_count: string;
    no_with_veto_count: string;
  };
  submit_time: string;
  deposit_end_time: string;
  total_deposit: [
    {
      denom: string;
      amount: string;
    }
  ];
  voting_start_time: string;
  voting_end_time: string;
  metadata: string;
  title: string;
  summary: string;
  proposer: string;
  expedited: boolean;
  failed_reason: string;
}