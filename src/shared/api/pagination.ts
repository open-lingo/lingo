// lingo/src/shared/api/pagination.ts
// Canonical cursor-based pagination shapes for all admin paginated lists.
// Convention: server returns up to `limit` items + optional `nextCursor`.
// Server internally fetches `limit + 1` rows — if it got more than `limit`,
// it returns first `limit` + a cursor pointing at row (limit+1). This is
// the "peek-ahead" pattern: cheap, consistent, no total-count needed.

export interface CursorPage<T> {
  items: T[];
  /** Opaque cursor for the next page. Absent/null means end of list. */
  nextCursor: string | null;
}

export interface PaginationParams {
  limit?: number;
  cursor?: string;
}
