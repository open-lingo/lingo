import { LANGUAGE_CONFIGS, AVAILABLE_LEARNING_LANGUAGE_IDS } from "@/shared/domain/languageConfig";
import { notoFlagUrl } from "@/shared/assets/notoEmoji";

const FLAG_CODES: Record<string, string> = {
  ja: "JP",
  ko: "KR",
  zh: "CN",
  es: "ES",
  de: "DE",
  fr: "FR",
  en: "GB",
};

const DISPLAY_ORDER = ["ja", "ko", "es", "de", "fr", "zh", "en"];

type Props = {
  label?: string;
  soonLabel?: string;
};

export function LanguageFlagsRow({ label, soonLabel = "Soon" }: Props) {
  const langs = DISPLAY_ORDER
    .map((id) => LANGUAGE_CONFIGS[id])
    .filter((l): l is NonNullable<typeof l> => Boolean(l));
  const available = new Set<string>(AVAILABLE_LEARNING_LANGUAGE_IDS);

  return (
    <div className="mx-auto mt-9 max-w-3xl px-6">
      {label && (
        <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.08em] text-text-muted">
          {label}
        </p>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        {langs.map((lang) => {
          const isAvailable = available.has(lang.id);
          const flagSrc = notoFlagUrl(FLAG_CODES[lang.id] ?? "");
          return (
            <span
              key={lang.id}
              className={
                "inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2 text-[13px] font-semibold text-text-primary shadow-card " +
                (isAvailable ? "" : "opacity-55")
              }
            >
              {flagSrc ? (
                <img
                  src={flagSrc}
                  alt=""
                  width={22}
                  height={22}
                  loading="lazy"
                  draggable={false}
                  className="h-[18px] w-[22px] select-none object-contain"
                />
              ) : (
                <span aria-hidden className="text-lg leading-none">
                  {lang.flag}
                </span>
              )}
              <span>{lang.name}</span>
              {!isAvailable && (
                <span className="rounded-full bg-surface-muted px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-text-muted">
                  {soonLabel}
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
