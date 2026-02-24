export type FilterItem = {
  label: string;
  value: string;
};

type FilterBarProps = {
  filters: {
    label: string;
    value: string;
    options: FilterItem[];
    onChange: (value: string) => void;
  }[];
  search?: {
    label: string;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    onRefresh?: () => void;
  };
  className?: string;
};

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

export function FilterBar({ filters, search, className = "" }: FilterBarProps) {
  return (
    <div
      className={`flex flex-wrap gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50 ${className}`}
    >
      {filters.map((f) => (
        <div key={f.label}>
          <label className="mr-2 text-xs text-gray-500">{f.label}</label>
          <select
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            {f.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ))}
      {search && (
        <div className="min-w-[180px] flex-1">
          <label className="mr-2 text-xs text-gray-500">{search.label}</label>
          <div className="relative">
            <input
              type="search"
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              placeholder={search.placeholder}
              className="w-full rounded border border-gray-300 px-2 py-1.5 pr-9 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            {search.onRefresh && (
              <button
                type="button"
                onClick={search.onRefresh}
                aria-label="Refresh"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-gray-300"
              >
                <RefreshIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
