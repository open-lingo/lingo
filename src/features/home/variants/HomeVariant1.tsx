import { Link } from "react-router-dom";
import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui";
import type { IconName } from "@/shared/iconRegistry";
import type { Quest } from "@/features/quests/types";
import type { HomeVariantData } from "./useHomeVariantData";
import { questRewardText } from "./homeVariantContent";

/**
 * Home redesign — "One Thing, with a way out."
 *
 * The soul is the minimalist One-Thing hero: a single calm, dominant
 * "continue where you left off" over the language's own backdrop. Flanking it
 * is a quiet launcher rail so the learner can peel off into flashcards or any
 * practice mode without the hero turning into a dashboard. Level + streak ride
 * on the hero as small glass stats. Everything else stays whisper-quiet.
 */
export function HomeVariant1({ data }: { data: HomeVariantData }) {
  return (
    // Sizing/centering is owned by the app shell (Layout <main> hub canvas):
    // this grid just fills it via flex-1. No width cap or min-height here.
    <div className="grid w-full flex-1 gap-5 lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-stretch">
      <div className="flex min-w-0 flex-col gap-5">
        <Hero data={data} />
        <BelowHero data={data} />
      </div>
      <Rail data={data} />
    </div>
  );
}

/* ── Below the hero: quests + recent progress ─────────────────────────── */

function isDailyDone(q: Quest): boolean {
  return (
    q.status === "claimable" ||
    q.status === "completed" ||
    q.progress.current >= q.progress.target
  );
}

function BelowHero({ data }: { data: HomeVariantData }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <QuestsCard data={data} />
      <RecentCard data={data} />
    </div>
  );
}

function QuestsCard({ data }: { data: HomeVariantData }) {
  const { goalQuests, dailyPlan } = data;
  return (
    <section className="rounded-card border border-border bg-surface p-5 shadow-card">
      <header className="flex items-center gap-2">
        <Icon name="trophy" size={16} aria-hidden className="text-accent" />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Quests</h2>
      </header>

      {goalQuests.length > 0 ? (
        <ul className="mt-4 space-y-4">
          {goalQuests.map(({ quest, percent, isClaimable }) => (
            <li key={quest.id}>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate font-semibold text-text-primary">{quest.title}</span>
                <span className="shrink-0 text-xs text-text-muted">
                  {quest.progress.current}/{quest.progress.target} {quest.progress.unit}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <span className="text-xs text-text-muted">{questRewardText(quest)}</span>
                {isClaimable ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent-muted px-2 py-0.5 text-xs font-semibold text-accent">
                    <Icon name="gem" size={12} aria-hidden />
                    Claim
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        // No longer-arc quests — fall back to today's daily goals so the block
        // still carries real, actionable content.
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Today&rsquo;s goals
          </p>
          {dailyPlan.daily.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {dailyPlan.daily.map((q) => {
                const done = isDailyDone(q);
                return (
                  <li key={q.id} className="flex items-center gap-2 text-sm">
                    <Icon
                      name={done ? "checkCircle" : "circle"}
                      size={16}
                      aria-hidden
                      className={done ? "text-success" : "text-text-muted"}
                    />
                    <span className={cn(done ? "text-text-muted line-through" : "text-text-primary")}>
                      {q.title}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-text-muted">Finish a lesson today to unlock your first quest.</p>
          )}
        </div>
      )}
    </section>
  );
}

function RecentCard({ data }: { data: HomeVariantData }) {
  return (
    <section className="rounded-card border border-border bg-surface p-5 shadow-card">
      <header className="flex items-center gap-2">
        <Icon name="checkCircle" size={16} aria-hidden className="text-success" />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Recent progress
        </h2>
      </header>
      {data.recentlyCompleted.length > 0 ? (
        <ul className="mt-4 space-y-2.5">
          {data.recentlyCompleted.map((title, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-text-primary">
              <Icon name="checkCircle" size={16} aria-hidden className="shrink-0 text-success" />
              <span className="truncate">{title}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-text-muted">Complete your first lesson to start a streak — it lands here.</p>
      )}

      <div className="mt-4 flex items-center gap-4 border-t border-border-muted pt-4 text-sm">
        <span className="flex items-center gap-1.5 text-text-secondary">
          <Icon name="bookOpen" size={15} aria-hidden className="text-accent" />
          {data.startedCount} words
        </span>
        <span className="flex items-center gap-1.5 text-text-secondary">
          <Icon name="graduationCap" size={15} aria-hidden className="text-accent" />
          {data.masteredCount} mastered
        </span>
        <span className="flex items-center gap-1.5 text-text-secondary">
          <Icon name="target" size={15} aria-hidden className="text-accent" />
          {data.courseCompletionPct}%
        </span>
      </div>
    </section>
  );
}

/* ── Immersive One-Thing hero ─────────────────────────────────────────── */

function Hero({ data }: { data: HomeVariantData }) {
  const bg = data.language?.backgroundImage;
  const hasBg = Boolean(bg);
  const { nextLesson } = data;

  return (
    <section
      className="relative flex min-h-[460px] flex-col overflow-hidden rounded-card border border-border shadow-card lg:flex-1"
      style={
        hasBg
          ? { backgroundImage: `url(${bg})`, backgroundSize: "cover", backgroundPosition: "center" }
          : {
              background:
                "linear-gradient(135deg, color-mix(in srgb, rgb(var(--color-accent)) 14%, transparent), color-mix(in srgb, rgb(var(--color-accent)) 3%, transparent))",
            }
      }
    >
      {hasBg ? (
        <>
          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/25"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/70 via-black/35 to-transparent"
          />
        </>
      ) : null}

      <div className="relative flex h-full flex-1 flex-col p-6 sm:p-8">
        {/* Top: greeting + level/streak glass stats */}
        <div className="flex items-start justify-between gap-4">
          <p
            className={cn(
              "flex min-w-0 items-center gap-1.5 text-sm font-medium",
              hasBg ? "text-white/85" : "text-text-secondary",
            )}
          >
            <Icon name="hand" size={16} aria-hidden className="shrink-0 text-warning" />
            <span className="truncate">
              Hi {data.name}
              <span className="hidden sm:inline"> · pick up where you left off</span>
            </span>
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <StatChip hasBg={hasBg} icon="flame" iconClass="text-warning">
              <span className="font-bold">{data.streak}</span>
              <span className={cn("text-[11px]", hasBg ? "text-white/70" : "text-text-muted")}>
                day{data.streak === 1 ? "" : "s"}
              </span>
            </StatChip>
            <StatChip hasBg={hasBg} icon="star" iconClass="text-accent">
              <span className="font-bold">Lv {data.level}</span>
            </StatChip>
          </div>
        </div>

        {/* Bottom: the one thing */}
        <div className="mt-auto max-w-2xl pt-10">
          {nextLesson ? (
            <>
              <p
                className={cn(
                  "text-xs font-semibold uppercase tracking-[0.18em]",
                  hasBg ? "text-white/70" : "text-text-muted",
                )}
              >
                {data.courseName}
              </p>
              <h1
                className={cn(
                  "mt-2 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl",
                  hasBg ? "text-white" : "text-text-primary",
                )}
              >
                {nextLesson.module}
              </h1>
              <p className={cn("mt-2 text-lg", hasBg ? "text-white/80" : "text-text-secondary")}>
                {nextLesson.lesson.title}
              </p>

              {/* hairline progress */}
              <div className="mt-6 max-w-md">
                <div
                  className={cn(
                    "h-[5px] w-full overflow-hidden rounded-full",
                    hasBg ? "bg-white/30 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)]" : "bg-surface-muted",
                  )}
                >
                  <div
                    className={cn("h-full rounded-full", hasBg ? "bg-white" : "bg-accent")}
                    style={{ width: `${Math.max(2, data.moduleProgressPercent)}%` }}
                  />
                </div>
                <p className={cn("mt-2 text-[13px]", hasBg ? "text-white/95" : "text-text-muted")}>
                  {data.lessonIndexLabel
                    ? `Lesson ${data.lessonIndexLabel.current} of ${data.lessonIndexLabel.total}`
                    : nextLesson.lesson.title}
                  {" · "}~{data.estMinutes} min · +{data.lessonReward.xp} XP
                </p>
              </div>

              <Link
                to={data.startLessonHref}
                className={cn(
                  "group mt-7 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold shadow-card transition",
                  hasBg
                    ? "bg-white text-accent hover:bg-white/90"
                    : "bg-accent text-accent-foreground hover:bg-accent-hover",
                )}
              >
                {data.isResume ? "Continue" : "Start"}
                <Icon
                  name="chevronRight"
                  size={20}
                  aria-hidden
                  className="transition group-hover:translate-x-0.5"
                />
              </Link>
            </>
          ) : (
            <>
              <h1
                className={cn(
                  "text-4xl font-bold tracking-tight sm:text-5xl",
                  hasBg ? "text-white" : "text-text-primary",
                )}
              >
                You&rsquo;re all caught up.
              </h1>
              <p className={cn("mt-2 text-lg", hasBg ? "text-white/80" : "text-text-secondary")}>
                {data.dueCount > 0
                  ? "Nothing new to start — keep your memory sharp with a review."
                  : "Nothing new to start right now — explore what's ahead."}
              </p>
              <Link
                to={data.dueCount > 0 ? data.hrefs.flashcardsReview : data.hrefs.courseMap}
                className={cn(
                  "mt-7 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold shadow-card transition",
                  hasBg
                    ? "bg-white text-accent hover:bg-white/90"
                    : "bg-accent text-accent-foreground hover:bg-accent-hover",
                )}
              >
                {data.dueCount > 0 ? `Review ${data.dueCount} cards` : "Explore the course map"}
                <Icon name="chevronRight" size={20} aria-hidden />
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function StatChip({
  hasBg,
  icon,
  iconClass,
  children,
}: {
  hasBg: boolean;
  icon: IconName;
  iconClass: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm backdrop-blur-md",
        hasBg
          ? "border-white/20 bg-white/10 text-white"
          : "border-border bg-surface-elevated/80 text-text-primary",
      )}
    >
      <Icon name={icon} size={16} aria-hidden className={iconClass} />
      {children}
    </span>
  );
}

/* ── Launcher rail ────────────────────────────────────────────────────── */

function Rail({ data }: { data: HomeVariantData }) {
  const dp = data.dailyPlan;
  return (
    <aside className="flex flex-col gap-3 rounded-card border border-border bg-surface p-3 shadow-card lg:h-full">
      <p className="px-2 pt-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
        Jump in
      </p>

      <div className="flex flex-col gap-0.5">
        <RailRow
          to={data.hrefs.flashcardsReview}
          icon="layers"
          title="Review flashcards"
          meta={data.dueCount > 0 ? `${data.dueCount} due · ${data.newToday} new` : "All caught up"}
          badge={data.dueCount > 0 ? String(data.dueCount) : undefined}
          primary
        />
        <RailRow
          to={data.hrefs.practiceHub}
          icon="target"
          title="Today's plan"
          meta={
            dp.daily.length > 0
              ? `${dp.doneCount} of ${dp.daily.length} done${dp.allDone ? " · complete" : ""}`
              : "No missions today"
          }
        />
      </div>

      <Divider />
      <p className="px-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Practice</p>
      <div className="flex flex-col gap-0.5">
        <RailRow to={data.hrefs.listening} icon="headphones" title="Listening" meta="Train your ear" />
        <RailRow to={data.hrefs.speaking} icon="mic" title="Speaking" meta="Say it out loud" />
        <RailRow to={data.hrefs.writing} icon="pencil" title="Writing" meta="Type what you hear" />
        <RailRow to={data.hrefs.grammar} icon="fileText" title="Grammar" meta="The rules behind it" />
        <RailRow
          to={data.hrefs.courseMap}
          icon="mapPin"
          title="Course map"
          meta={`${data.completedLessonsCount} of ${data.totalLessonsCount} lessons · ${data.courseCompletionPct}%`}
        />
      </div>

      {data.wordOfDay || data.tip ? (
        <div className="flex flex-col gap-3 lg:mt-auto">
          <Divider />
          {data.wordOfDay ? (
            <div className="flex items-center gap-3 px-2 py-1">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-accent">
                <Icon name="volume" size={16} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text-primary">
                  {data.wordOfDay.front}
                  <span className="ml-1.5 font-normal text-text-muted">{data.wordOfDay.back}</span>
                </p>
                <p className="text-[11px] uppercase tracking-wide text-text-muted">Word of the day</p>
              </div>
            </div>
          ) : null}
          <div className="flex items-start gap-2 px-2 pb-1 pt-0.5">
            <Icon name="lightbulb" size={15} aria-hidden className="mt-0.5 shrink-0 text-accent" />
            <p className="text-xs leading-relaxed text-text-secondary">
              <span className="font-semibold text-text-primary">{data.tip.title}.</span>{" "}
              {data.tip.body}
            </p>
          </div>
        </div>
      ) : null}
    </aside>
  );
}

function RailRow({
  to,
  icon,
  title,
  meta,
  badge,
  primary = false,
}: {
  to: string;
  icon: IconName;
  title: string;
  meta?: string;
  badge?: string;
  primary?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition",
        primary ? "bg-accent-muted" : "hover:bg-surface-elevated",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          primary ? "bg-accent text-accent-foreground" : "bg-surface-muted text-accent",
        )}
      >
        <Icon name={icon} size={18} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-text-primary">{title}</span>
        {meta ? <span className="block truncate text-xs text-text-muted">{meta}</span> : null}
      </span>
      {badge ? (
        <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
          {badge}
        </span>
      ) : null}
      <Icon
        name="chevronRight"
        size={16}
        aria-hidden
        className="shrink-0 text-text-muted transition group-hover:translate-x-0.5"
      />
    </Link>
  );
}

function Divider() {
  return <div className="mx-2 border-t border-border-muted" />;
}
