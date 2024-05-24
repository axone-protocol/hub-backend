import { DBTimeInterval } from "@core/enums/db-time-interval.enum"
import { Range } from "@core/enums/range.enum"

export type RangeHistoricalChartConf = Map<Range, HistoricalChartConf>;

export interface HistoricalChartConf { interval: DBTimeInterval, count?: number };