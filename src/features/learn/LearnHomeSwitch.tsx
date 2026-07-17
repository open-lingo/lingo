import { useEffect, useMemo } from "react";
import { useLang } from "@/shared/hooks/useLangPath";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { isTransitLearnHome } from "@/shared/config/featureFlags";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { prefetchLesson } from "@/shared/utils/routePrefetch";
import { stringsFor, LEARN_HEADER_SUBTITLE } from "./transitStrings";
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
      className={
        mode === m
          ? "rounded-sm bg-accent px-3 py-1 text-[12.5px] font-bold text-accent-foreground transition"
          : "rounded-sm px-3 py-1 text-[12.5px] font-bold text-text-secondary transition hover:text-text-primary"
      }
    >
      {label}
    </button>
  );
  return (
    <div className="flex flex-none gap-0.5 rounded-md border border-border bg-surface-muted p-0.5">
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

  // Warm the lesson chunk while the learner is on the path, so launching a
  // lesson (station / resume FAB) navigates instantly and the start wipe
  // fires without the chunk-load delay.
  useEffect(() => {
    prefetchLesson();
  }, []);

  if (!eligible) return <LearnPage />;
  if (mode === "map") {
    return <TransitLearnPage headerRight={<ViewToggle mode={mode} onChange={setMode} />} />;
  }

  const strings = stringsFor(lang ?? "ko");
  return (
    <div className="tmc-root mx-auto max-w-[min(2100px,96vw)] px-2 pb-4 pt-2.5 sm:px-3">
      <TransitSignageHeader
        title={`${strings.mapTitle} — ${course.title}`}
        subtitle={LEARN_HEADER_SUBTITLE}
        right={<ViewToggle mode={mode} onChange={setMode} />}
      />
      <LearnPage variant="list" />
    </div>
  );
}
