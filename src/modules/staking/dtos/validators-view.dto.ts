export interface ValidatorsViewDto {
  logo: string;
  description: {
    moniker: string;
    identity: string;
    website: string;
    securityContact: string;
    details: string;
  };
  commission: {
    rate: string;
    maxRate: string;
    maxChangeRate: string;
    updateTime: string;
  };
  address: string;
  status: string;
  jailed: boolean;
  stakedAmount: string;
}