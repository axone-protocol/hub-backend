import { FailedResponse } from './failed.response';

export type GSFResponse<T> = T | FailedResponse; // Generic Success / Failed Response for Osmosis
