export interface UserLookupResponse {
  status: {
    code: number;
    name: string;
  },
  them: [
    {
      id: string;
      pictures: {
        primary: {
          url: string;
          source: string;
        }
      }
    }
  ]
}