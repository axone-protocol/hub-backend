export interface StakingPoolResponse {
  pool: {
    not_bonded_tokens: string;
    bonded_tokens: string;
  };
}
