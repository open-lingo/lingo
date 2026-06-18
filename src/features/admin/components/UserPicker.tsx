/**
 * UserPicker — shared admin user lookup widget.
 *
 * Debounced search against `admin.listUsers({search})` with a tap-to-select
 * result list. The caller decides what selection means (navigate to a
 * detail page, open a panel, populate a form) by handling `onSelect(userId)`.
 *
 * Visual surface is the centered "Search for a user" affordance — same
 * shape it had inside AdminLmsPage; extracted so other admin pages can
 * mount it without re-implementing search.
 */
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useApi } from "@/shared/api/provider";
import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui/cn";
import { inputClassName } from "@/shared/components/ui/formStyles";

type Props = {
  /** Called with the picked user's UUID when a result row is clicked. */
  onSelect: (userId: string) => void;
  /** Optional heading text. Defaults to "Find a user". */
  title?: string;
  /** Optional subtitle/help text under the heading. */
  description?: string;
  /** Input placeholder. */
  placeholder?: string;
  /** Autofocus the input on mount. Default true. */
  autoFocus?: boolean;
};

export function UserPicker({
  onSelect,
  title = "Find a user",
  description = "Search by username, display name, or partial user ID.",
  placeholder = "Username, display name, or partial user ID…",
  autoFocus = true,
}: Props) {
  const { admin } = useApi();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  const result = useQuery({
    queryKey: ["admin", "userPicker", debouncedQuery],
    queryFn: () => admin.listUsers({ search: debouncedQuery || undefined, limit: 10 }),
    enabled: debouncedQuery.length >= 1,
    staleTime: 30_000,
  });

  return (
    <div className="w-full max-w-lg space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
        <p className="text-sm text-text-muted mt-1">{description}</p>
      </div>
      <div className="relative">
        <Icon
          name="search"
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          aria-hidden
        />
        <input
          type="search"
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={cn(inputClassName, "pl-9")}
        />
      </div>
      {result.isLoading && (
        <p className="text-sm text-text-muted">Searching…</p>
      )}
      {result.data && result.data.items.length === 0 && debouncedQuery && (
        <p className="text-sm text-text-muted">No users found for &ldquo;{debouncedQuery}&rdquo;.</p>
      )}
      {result.data && result.data.items.length > 0 && (
        <div className="rounded-card border border-border overflow-hidden">
          {result.data.items.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => onSelect(user.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-border last:border-b-0 hover:bg-surface-muted transition"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text-primary">@{user.username}</span>
                  {user.display_name !== user.username && (
                    <span className="text-text-muted text-sm truncate">{user.display_name}</span>
                  )}
                </div>
                <p className="font-mono text-xs text-text-muted truncate mt-0.5">{user.id}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="font-mono text-xs text-text-secondary">
                  {(user.xp ?? 0).toLocaleString()} XP
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserPicker;
