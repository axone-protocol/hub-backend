import { WithPaginationResponse } from "./with-pagination.response";

export type GetProposalVotesResponse = WithPaginationResponse<{
  votes: Vote[];
}>;

export interface Vote {
  proposal_id: string;
  voter: string;
  options: [
    {
      option: string;
      weight: string;
    }
  ];
  metadata: string;
}
