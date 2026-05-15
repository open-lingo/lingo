/**
 * Sort items by updatedAt descending (newest first).
 * Handles missing or null updatedAt by treating as 0.
 */
export function sortByUpdatedAtDesc<T extends { updatedAt?: string | null }>(
  items: T[]
): T[] {
  return [...items].sort(
    (a, b) =>
      new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime()
  );
}

/**
 * Sort items by createdAt ascending (oldest first).
 */
export function sortByCreatedAtAsc<T extends { createdAt?: string | null }>(
  items: T[]
): T[] {
  return [...items].sort(
    (a, b) =>
      new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
  );
}

/**
 * Sort items by createdAt descending (newest first).
 */
export function sortByCreatedAtDesc<T extends { createdAt?: string | null }>(
  items: T[]
): T[] {
  return [...items].sort(
    (a, b) =>
      new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  );
}
