import { useMemo } from "react";
import { useLang } from "@/shared/hooks/useLangPath";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { isTransitLearnHome } from "@/shared/config/featureFlags";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { stringsFor } from "./transitStrings";
import { useLearnViewMode, type LearnViewMode } from "./hooks/useLearnViewMode";
import { TransitSignageHeader } from "./components/TransitSignageHeader";
import TransitLearnPage from "./TransitLearnPage";
import { LearnPage } from "./LearnPage";
import "./transitLearnPage.css";

function ViewToggle({
  mode,
  onChange,
}: {
  mode: LearnViewMode;
  onChange: (m: LearnViewMode) => void;
}) {
  const opt = (m: LearnViewMode, label: string) => (
    <button
      key={m}
      type="button"
      onClick={() => onChange(m)}
      aria-pressed={mode === m}
      className="rounded-sm px-3 py-1.5 text-[12.5px] font-bold transition"
      style={
        mode === m
          ? { background: "var(--tmc-signage-fg)", color: "var(--tmc-signage-bg)" }
          : { color: "var(--tmc-signage-fg)", opacity: 0.75 }
      }
    >
      {label}
    </button>
  );
  return (
    <div
      className="flex flex-none gap-0.5 rounded-sm p-0.5"
      style={{ border: "2px solid var(--tmc-signage-fg)" }}
    >
      {opt("map", "Path")}
      {opt("list", "List")}
    </div>
  );
}

/**
 * learn index dispatcher: transit-eligible languages get the persisted
 * Path⇄List switch (signage header survives the swap); everyone else gets
 * the classic page directly. `learn/classic` stays as the bare deep link.
 */
export function LearnHomeSwitch() {
  const lang = useLang();
  const flags = useFeatureFlags();
  const [mode, setMode] = useLearnViewMode(lang ?? "ko");
  const eligible = isTransitLearnHome(flags, lang);
  const course = useMemo(() => getMockCourse(lang ?? "ko"), [lang]);

  if (!eligible) return <LearnPage />;
  if (mode === "map") {
    return <TransitLearnPage headerRight={<ViewToggle mode={mode} onChange={setMode} />} />;
  }

  const strings = stringsFor(lang ?? "ko");
  return (
    <div className="tmc-root">
      <div className="mx-auto max-w-6xl px-3 pt-4 sm:px-5">
        <TransitSignageHeader
          title={`${strings.mapTitle} — ${course.title}`}
          subtitle="Browse every module and lesson as a list"
          right={<ViewToggle mode={mode} onChange={setMode} />}
        />
      </div>
      <LearnPage />
    </div>
  );
}
