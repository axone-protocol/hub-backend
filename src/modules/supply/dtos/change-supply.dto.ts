import { SupplyIntervalDto } from "./supply-interval.dto";

export type ChangeSupplyDto = SupplyIntervalDto & { percentChange: string; };