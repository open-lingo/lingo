import { Icon } from "@/shared/components/Icon";

export type DataTableColumn<T> = {
  key: string;
  label: string;
  sortable?: boolean;
  render: (row: T) => React.ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;
  emptyMessage?: string;
  className?: string;
  /** Enable row selection with checkboxes */
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
};

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  sortKey,
  sortDir,
  onSort,
  emptyMessage,
  className = "",
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
}: DataTableProps<T>) {
  const allIds = rows.map((r) => getRowKey(r));
  const allSelected =
    allIds.length > 0 && allIds.every((id) => selectedIds.has(id));

  const toggleRow = (id: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) onSelectionChange(new Set());
    else onSelectionChange(new Set(allIds));
  };

  return (
    <div
      className={`overflow-x-auto rounded-lg border border-border ${className}`}
    >
      {rows.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-text-muted">
          {emptyMessage ?? "No items"}
        </div>
      ) : (
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-surface-muted">
            <tr>
              {selectable && (
                <th scope="col" className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all"
                    className="h-4 w-4 rounded border-border accent-accent"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={
                    col.sortable && onSort
                      ? "cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted hover:text-text-primary"
                      : "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted"
                  }
                  onClick={
                    col.sortable && onSort
                      ? () => onSort(col.key)
                      : undefined
                  }
                >
                  {col.label}
                  {col.sortable && sortKey === col.key && sortDir && (
                    <span className="ml-1 inline-flex"><Icon name={sortDir === "asc" ? "chevronUp" : "chevronDown"} size={14} /></span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {rows.map((row) => {
              const id = getRowKey(row);
              return (
                <tr
                  key={id}
                  className="hover:bg-surface-muted"
                >
                  {selectable && (
                    <td className="w-10 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(id)}
                        onChange={() => toggleRow(id)}
                        aria-label={`Select row ${id}`}
                        className="h-4 w-4 rounded border-border accent-accent"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-2 text-sm ${col.className ?? ""}`}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
