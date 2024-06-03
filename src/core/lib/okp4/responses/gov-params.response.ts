export interface GovParamsResponse {
  voting_params: {
    voting_period: string;
  };
  deposit_params: unknown;
  tally_params: unknown;
  params: {
    min_deposit: [
      {
        denom: string;
        amount: string;
      }
    ];
    max_deposit_period: string;
    voting_period: string;
    quorum: string;
    threshold: string;
    veto_threshold: string;
    min_initial_deposit_ratio: string;
    proposal_cancel_ratio: string;
    proposal_cancel_dest: string;
    expedited_voting_period: string;
    expedited_threshold: string;
    expedited_min_deposit: [
      {
        denom: string;
        amount: string;
      }
    ];
    burn_vote_quorum: boolean;
    burn_proposal_deposit_prevote: boolean;
    burn_vote_veto: boolean;
    min_deposit_ratio: string;
  }
}