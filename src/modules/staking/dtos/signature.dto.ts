import { SignatureViewStatus } from "../enums/signature-view-status.enum";

export interface SignatureDto {
  status: SignatureViewStatus;
  address: string;
  timestamp: string;
  signature: string;
}