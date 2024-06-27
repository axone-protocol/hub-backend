export type WithPagination<T> = T & Pagination;
export interface Pagination {
  limit?: number;
  offset?: number;
}
