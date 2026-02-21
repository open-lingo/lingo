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
  };
  className?: string;
};

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
          <input
            type="search"
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder={search.placeholder}
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
      )}
    </div>
  );
}
