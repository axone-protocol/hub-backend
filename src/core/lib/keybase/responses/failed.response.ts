export interface FailedResponse {
  status: {
    code: number;
    desc: string;
    fields: {
      key_suffix: string;
    };
    name: string;
  }
}