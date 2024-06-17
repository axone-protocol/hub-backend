import { WithPaginationResponse } from "./with-pagination.response"
import { Proposal } from "@core/lib/okp4/responses/get-proposals.response";

export type GetProposalResponse = WithPaginationResponse<{ proposal: Proposal }>;
