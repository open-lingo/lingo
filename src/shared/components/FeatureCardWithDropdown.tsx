import { useState, useRef, useEffect } from "react";
import { Icon } from "@/shared/components/Icon";
import { Chevron } from "@/shared/components/Chevron";
import { Link } from "react-router-dom";

export type FeatureCardOption = {
  href: string;
  labelKey?: string;
  label?: string;
  iconName?: "stories" | "decks" | "graduationCap" | "link" | "video";
  sampleCharacter?: string;
};

export type FeatureCardWithDropdownProps = {
  icon: "graduationCap" | "dumbbell";
  titleKey: string;
  descriptionKey: string;
  promptTextKey: string;
  options: FeatureCardOption[];
  /** Used to resolve label when option has labelKey */
  t: (key: string) => string;
};

export function FeatureCardWithDropdown({
  icon,
  titleKey,
  descriptionKey,
  promptTextKey,
  options,
  t,
}: FeatureCardWithDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="relative flex flex-col" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="group flex flex-1 flex-col rounded-xl border border-border bg-surface p-6 text-left shadow-card transition hover:shadow-md"
      >
        <span className="mb-3 flex shrink-0 items-center justify-center" aria-hidden>
          <Icon name={icon} size={36} />
        </span>
        <h2 className="text-lg font-semibold text-text-primary">
          {t(titleKey)}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {t(descriptionKey)}
        </p>
        <span className="mt-2 inline-flex items-center text-xs text-text-muted">
          {t(promptTextKey)}
          <Chevron className={`ml-1 h-4 w-4 ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <ul className="absolute left-0 right-0 top-full z-10 mt-1 min-w-[200px] rounded-lg border border-border bg-surface py-1 shadow-popover">
          {options.map((opt) => {
            const label = opt.labelKey ? t(opt.labelKey) : (opt.label ?? "");
            return (
              <li key={opt.href + label}>
                <Link
                  to={opt.href}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-surface-muted"
                  onClick={() => setOpen(false)}
                >
                  {opt.iconName && (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center" aria-hidden>
                      <Icon name={opt.iconName} size={20} />
                    </span>
                  )}
                  {!opt.iconName && opt.sampleCharacter && (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center text-lg" aria-hidden>
                      {opt.sampleCharacter}
                    </span>
                  )}
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
