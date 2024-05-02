export type HistoricalChartRes = HistoricalChartItem[];

export type HistoricalChartItem = {
  time: number;
  close: number;
  high: number;
  low: number;
  open: number;
  volume: number;
};
