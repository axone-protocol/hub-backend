export type WithPaginationResponse<T> = T & { pagination: Pagination };

export interface Pagination {
    next_key: string;
    total: string;
}