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
}: DataTableProps<T>) {
  return (
    <div
      className={`overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {rows.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          {emptyMessage ?? "No items"}
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={
                    col.sortable && onSort
                      ? "cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      : "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  }
                  onClick={
                    col.sortable && onSort
                      ? () => onSort(col.key)
                      : undefined
                  }
                >
                  {col.label}
                  {col.sortable && sortKey === col.key && sortDir && (
                    <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
            {rows.map((row) => (
              <tr
                key={getRowKey(row)}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-2 text-sm ${col.className ?? ""}`}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
