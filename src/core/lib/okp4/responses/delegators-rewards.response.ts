export interface DelegatorsRewardsResponse {
  rewards: Reward[];
  total: Total[];
}

export interface Reward {
  validator_address: string;
  reward: [
    {
      denom: string;
      amount: string;
    }
  ]
}

export interface Total {
  denom: string;
  amount: string;
}