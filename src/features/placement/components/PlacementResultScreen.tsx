import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getMockCourse } from "@/shared/domain/mockCourse";
import type { MissedSkill } from "../engine/adaptiveEngine";

/** Sort "m3"/"m12" chips numerically so M20 doesn't lead M1. */
function sortModuleIds(ids: string[]): string[] {
  const num = (id: string) => parseInt(id.replace(/^m/i, ""), 10) || 0;
  return [...ids].sort((a, b) => num(a) - num(b));
}

type Props = {
  passedModules: string[];
  assumedModules?: string[];
  missedSkills?: MissedSkill[];
  skippedLessonCount: number;
  seededAtomCount: number;
  isTestOut: boolean;
  testOutModuleLabel?: string;
  onContinue: () => void;
};

/**
 * De-duplicated human labels for the grammar points a learner missed.
 * Bare module ids ("m25") read as debug output on the result screen
 * (Spencer QA 2026-07-12) — resolve them to the module's real title.
 */
function missedSkillLabels(
  missed: MissedSkill[],
  moduleTitle: (id: string) => string,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of missed) {
    let label = m.skill ?? m.grammarPointId ?? m.moduleId;
    if (/^m\d+$/i.test(label)) label = moduleTitle(label);
    if (seen.has(label)) continue;
    seen.add(label);
    out.push(label);
  }
  return out;
}

function ModuleChips({ modules }: { modules: string[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {modules.map((m) => (
        <span
          key={m}
          className="rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent"
        >
          {m.toUpperCase()}
        </span>
      ))}
    </div>
  );
}

export function PlacementResultScreen({
  passedModules,
  assumedModules = [],
  missedSkills = [],
  skippedLessonCount,
  seededAtomCount,
  isTestOut,
  testOutModuleLabel,
  onContinue,
}: Props) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const passed = passedModules.length > 0;
  const moduleTitle = (id: string): string => {
    const course = getMockCourse(language?.id ?? "ja");
    const mod = course.modules.find((m) => m.id === id.toLowerCase());
    return mod ? `${id.toUpperCase()} — ${mod.title}` : id.toUpperCase();
  };
  const missedLabels = missedSkillLabels(missedSkills, moduleTitle);

  if (isTestOut) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
          <Icon
            name={passed ? "check" : "close"}
            size={48}
            className={passed ? "text-accent" : "text-error"}
          />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">
          {passed
            ? t("placement.testOutPassedTitle", "Module cleared!")
            : t("placement.testOutFailedTitle", "Not quite yet")}
        </h1>
        <p className="max-w-md text-text-secondary">
          {passed
            ? t("placement.testOutPassedBody", {
                defaultValue:
                  "You tested out of {{module}}. {{atomCount}} vocab items are now in your review queue for a quick refresher.",
                module: testOutModuleLabel ?? passedModules[0],
                atomCount: seededAtomCount,
              })
            : t(
                "placement.testOutFailedBody",
                "A near-miss doesn't clear a module — you can miss at most one. Here's what tripped you up; keep practicing and try again.",
              )}
        </p>
        {!passed && missedLabels.length > 0 && (
          <div className="max-w-md rounded-xl border border-border bg-surface-2 p-4 text-left">
            <p className="mb-2 text-sm font-semibold text-text-primary">
              {t("placement.missedHeading", "What to focus on")}
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-text-secondary">
              {missedLabels.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        )}
        <button
          onClick={onContinue}
          className="rounded-xl bg-accent px-8 py-3 text-lg font-semibold text-white shadow-md hover:bg-accent-hover active:scale-[0.98]"
        >
          {t("placement.continue", "Continue")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
        <Icon name="graduationCap" size={48} className="text-accent" />
      </div>
      <h1 className="text-2xl font-bold text-text-primary">
        {passed
          ? t("placement.resultPassedTitle", "Here's where you landed")
          : t("placement.resultFailedTitle", "Starting from the top")}
      </h1>

      {passed ? (
        <>
          {/* Verified — actually tested out. */}
          <div className="flex w-full max-w-md flex-col gap-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">
              {t("placement.verifiedHeading", "Tested out")}
            </p>
            <p className="text-sm text-text-secondary">
              {t("placement.verifiedBody", {
                defaultValue:
                  "You proved these — we completed {{lessonCount}} lessons and added {{atomCount}} words to your reviews.",
                lessonCount: skippedLessonCount,
                atomCount: seededAtomCount,
              })}
            </p>
            <ModuleChips modules={sortModuleIds(passedModules)} />
          </div>

          {/* Assumed — credited from level AND marked done (policy 2026-07-12):
              a learner who placed above these shouldn't be nagged to walk
              them; their vocab rides SRS review where real gaps surface. */}
          {assumedModules.length > 0 && (
            <div className="flex w-full max-w-md flex-col gap-2">
              <p className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
                {t("placement.assumedHeading", "Credited from your level")}
              </p>
              <p className="text-sm text-text-secondary">
                {t("placement.assumedBody", {
                  defaultValue:
                    "These sit below where you placed, so they're marked done — their vocab is in your reviews, and anything shaky will resurface there.",
                })}
              </p>
              <ModuleChips modules={sortModuleIds(assumedModules)} />
            </div>
          )}

          {/* Gaps — missed grammar points, queued into review. */}
          {missedLabels.length > 0 && (
            <div className="w-full max-w-md rounded-xl border border-border bg-surface-2 p-4 text-left">
              <p className="mb-2 text-sm font-semibold text-text-primary">
                {t("placement.gapHeading", "Queued for review — you missed:")}
              </p>
              <ul className="list-inside list-disc space-y-1 text-sm text-text-secondary">
                {missedLabels.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <p className="max-w-md text-text-secondary">
          {t(
            "placement.resultFailedBody",
            "No worries — you'll start with the fundamentals. The course will build your skills step by step.",
          )}
        </p>
      )}

      <button
        onClick={onContinue}
        className="rounded-xl bg-accent px-8 py-3 text-lg font-semibold text-white shadow-md hover:bg-accent-hover active:scale-[0.98]"
      >
        {t("placement.startLearning", "Start learning")}
      </button>
    </div>
  );
}
