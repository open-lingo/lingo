import { Icon } from "@/shared/components/Icon";

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

export function FilterBar({ filters, search, className = "" }: FilterBarProps) {
  return (
    <div
      className={`flex flex-wrap gap-4 rounded-lg border border-border bg-surface-muted p-4 ${className}`}
    >
      {filters.map((f) => (
        <div key={f.label}>
          <label className="mr-2 text-xs text-text-muted">{f.label}</label>
          <select
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            className="rounded border border-border bg-surface px-2 py-1.5 text-sm text-text-primary"
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
          <label className="mr-2 text-xs text-text-muted">{search.label}</label>
          <div className="relative">
            <input
              type="search"
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              placeholder={search.placeholder}
              className="w-full rounded border border-border bg-surface px-2 py-1.5 pr-9 text-sm text-text-primary"
            />
            {search.onRefresh && (
              <button
                type="button"
                onClick={search.onRefresh}
                aria-label="Refresh"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-text-muted hover:bg-surface-muted hover:text-text-primary"
              >
                <Icon name="refresh" size={16} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
