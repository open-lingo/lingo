/**
 * Dev-only mockup for the home-page restructure (2026-05-18).
 * Goal: faithful preview of Spencer's annotated layout using current theme
 * tokens — no real data wiring; everything below is intentionally mocked so
 * we can iterate on visuals before committing to a design.
 *
 * Route: /:lang/home-preview
 */
import { Link } from "react-router-dom";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import type { IconName } from "@/shared/iconRegistry";
import { cn } from "@/shared/components/ui/cn";

/* ────────────────────────────────────────────────────────────────────────── */
/* Mock data — replace with real wiring during implementation pass           */
/* ────────────────────────────────────────────────────────────────────────── */

const MOCK = {
  name: "Spencer",
  // Hero "where you left off"
  module: { id: "m1", name: "Module 1 — Hiragana", short: "Vowels" },
  upNext: { lessonTitle: "Vowels — Intro 1", lessonNum: 2, lessonsInModule: 39, percent: 3 },
  // Account overview
  streakDays: 7,
  xpToday: 60,
  xpTotal: 1240,
  level: 4,
  nextLevelXp: 1500,
  kanaMasteryPercent: 38,
  dailyGoalDoneMin: 8,
  dailyGoalMin: 15,
  // Weekly sparkline (minutes per day for last 7 days)
  weekMinutes: [12, 18, 6, 0, 22, 14, 8],
  // Flashcards
  cardsDue: 23,
  cardsDueToday: 11,
  cardsHotPreview: ["か", "き", "く", "け", "こ"],
  // Recent practice
  recentPractice: {
    title: "Alphabet — Hiragana",
    subtitle: "Last reviewed 2 hours ago",
    iconName: "bookText" as IconName,
    href: "practice/alphabet",
  },
  // Daily & weekly quests
  dailyQuests: [
    { id: "d1", label: "Complete a lesson", done: 1, goal: 1, xp: 15, iconName: "graduationCap" as IconName },
    { id: "d2", label: "Review 20 flashcards", done: 11, goal: 20, xp: 10, iconName: "decks" as IconName },
    { id: "d3", label: "5 minutes of practice", done: 8, goal: 5, xp: 5, iconName: "dumbbell" as IconName },
  ],
  weeklyQuest: { label: "Finish 5 lessons", done: 3, goal: 5, xp: 75 },
  // Social
  friends: [
    { id: "f1", name: "Mia", streak: 12, status: "active" as const },
    { id: "f2", name: "Kenji", streak: 4, status: "idle" as const },
    { id: "f3", name: "Aisha", streak: 9, status: "active" as const },
  ],
  friendSuggestions: [
    { id: "s1", name: "Hiroshi", reason: "Also learning Japanese · 3 mutuals" },
  ],
  friendQuest: { label: "Both finish a lesson today", you: 1, friend: 0, friendName: "Mia" },
  // Community
  community: [
    {
      id: "c1",
      kind: "thread" as const,
      title: "Tips for memorizing yōon?",
      meta: "12 replies · 2h ago",
      iconName: "fileText" as IconName,
      isNew: true,
    },
    {
      id: "c2",
      kind: "deck" as const,
      title: "New deck: N5 Verb Conjugation Drills",
      meta: "Added today · 320 cards",
      iconName: "decks" as IconName,
      isNew: true,
    },
    {
      id: "c3",
      kind: "article" as const,
      title: "Why は and が aren't the same thing",
      meta: "Article · 7 min read",
      iconName: "newspaper" as IconName,
    },
  ],
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Hero                                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

function HeroSection({ langName, bgImage }: { langName: string | null; bgImage?: string }) {
  const langPath = useLangPath();
  const hasBg = Boolean(bgImage);
  const pct = MOCK.upNext.percent;

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-border shadow-card"
      style={
        bgImage
          ? {
              backgroundImage: `url(${bgImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : {
              background:
                "linear-gradient(135deg, color-mix(in srgb, rgb(var(--color-accent)) 10%, transparent), color-mix(in srgb, rgb(var(--color-accent)) 2%, transparent))",
            }
      }
    >
      {/* dark: intentional — heavier overlay on dark themes for legibility over background images */}
      {hasBg ? (
        <span
          className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/55 to-black/20 dark:from-black/80 dark:via-black/65"
          aria-hidden
        />
      ) : null}

      <div className="relative grid gap-6 px-6 py-8 sm:px-8 sm:py-10 md:grid-cols-[1.2fr_1fr] md:items-center md:gap-10">
        {/* Left: greeting + CTA */}
        <div>
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.18em]",
              hasBg ? "text-white/85" : "text-accent",
            )}
          >
            Welcome back to Lingo
          </p>
          <h1
            className={cn(
              "mt-2 text-2xl font-bold leading-tight sm:text-3xl md:text-4xl",
              hasBg ? "text-white" : "text-text-primary",
            )}
          >
            Hi {MOCK.name} — let's keep going.
          </h1>
          <p
            className={cn(
              "mt-2 max-w-md text-base sm:text-lg",
              hasBg ? "text-white/90" : "text-text-secondary",
            )}
          >
            You're on a {MOCK.streakDays}-day streak. Five focused minutes will keep it alive.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to={langPath("learn")}
              className={cn(
                "group inline-flex items-center gap-2.5 rounded-xl px-5 py-3 text-base font-semibold shadow-card transition",
                hasBg
                  ? "bg-white text-accent hover:bg-white/95"
                  : "bg-accent text-accent-foreground hover:bg-accent-hover",
              )}
            >
              Continue lesson
              <Icon
                name="chevronRight"
                size={20}
                className="transition group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
            <p className={cn("text-sm", hasBg ? "text-white/80" : "text-text-muted")}>
              Up next: <span className="font-medium">{MOCK.upNext.lessonTitle}</span>
            </p>
          </div>
        </div>

        {/* Right: "where you left off" inset */}
        <div
          className={cn(
            "relative rounded-2xl border p-5 backdrop-blur-md",
            hasBg
              ? "border-white/20 bg-white/10 text-white"
              : "border-border bg-surface-elevated/80",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p
                className={cn(
                  "text-xs font-semibold uppercase tracking-wider",
                  hasBg ? "text-white/75" : "text-text-muted",
                )}
              >
                Where you left off
              </p>
              <p className={cn("mt-1 truncate font-semibold", hasBg ? "text-white" : "text-text-primary")}>
                {MOCK.module.name}
              </p>
              <p className={cn("mt-0.5 text-sm", hasBg ? "text-white/80" : "text-text-secondary")}>
                {MOCK.upNext.lessonTitle}
              </p>
            </div>
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                hasBg ? "bg-white/15 text-white" : "bg-accent-muted text-accent",
              )}
              aria-hidden
            >
              <Icon name="bookOpen" size={22} />
            </span>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className={cn(hasBg ? "text-white/80" : "text-text-secondary")}>
                Lesson {MOCK.upNext.lessonNum} of {MOCK.upNext.lessonsInModule}
              </span>
              <span className={cn("font-semibold", hasBg ? "text-white" : "text-text-primary")}>
                {pct}%
              </span>
            </div>
            <div
              className={cn(
                "mt-1.5 h-1.5 overflow-hidden rounded-full",
                hasBg ? "bg-white/20" : "bg-surface-muted",
              )}
            >
              <div
                className={cn("h-full rounded-full", hasBg ? "bg-white" : "bg-accent")}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <p className={cn("mt-3 text-[11px]", hasBg ? "text-white/70" : "text-text-muted")}>
            {langName ?? "Language"} · paused 2 hours ago
          </p>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Account Overview                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

function ProgressRing({
  percent,
  size = 84,
  stroke = 8,
  label,
  sublabel,
  accentClass = "text-accent",
}: {
  percent: number;
  size?: number;
  stroke?: number;
  label: string;
  sublabel?: string;
  accentClass?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, percent)) / 100) * c;

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          className="text-surface-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          className={accentClass}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-text-primary leading-none">{label}</span>
        {sublabel ? (
          <span className="mt-0.5 text-[10px] uppercase tracking-wider text-text-muted">
            {sublabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function WeekSparkline({ data }: { data: number[] }) {
  const max = Math.max(1, ...data);
  return (
    <div className="flex items-end gap-1.5">
      {data.map((v, i) => (
        <div
          key={i}
          className="w-3 rounded-sm bg-accent/80"
          style={{ height: `${Math.max(6, (v / max) * 36)}px`, opacity: v === 0 ? 0.25 : 1 }}
          aria-hidden
        />
      ))}
    </div>
  );
}

function AccountOverviewCard() {
  const dailyPct = Math.min(100, Math.round((MOCK.dailyGoalDoneMin / MOCK.dailyGoalMin) * 100));
  const levelPct = Math.min(100, Math.round((MOCK.xpTotal / MOCK.nextLevelXp) * 100));

  return (
    <Card padding="lg" className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Account overview
          </p>
          <h2 className="mt-1 text-lg font-semibold text-text-primary sm:text-xl">
            Your progress at a glance
          </h2>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-accent-muted px-2.5 py-1 text-xs font-bold text-accent">
          <Icon name="star" size={14} aria-hidden />
          Level {MOCK.level}
        </span>
      </div>

      {/* Top metric row */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3">
          <ProgressRing
            percent={dailyPct}
            label={`${MOCK.dailyGoalDoneMin}m`}
            sublabel="goal"
            accentClass="text-accent"
          />
          <div>
            <p className="text-sm font-medium text-text-secondary">Daily goal</p>
            <p className="text-xs text-text-muted">
              {MOCK.dailyGoalDoneMin} / {MOCK.dailyGoalMin} min today
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex h-[84px] w-[84px] items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-warning/10" aria-hidden />
            <Icon name="flame" size={42} className="text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary leading-none">
              {MOCK.streakDays}
              <span className="ml-1 text-base font-medium text-text-secondary">days</span>
            </p>
            <p className="mt-1 text-xs text-text-muted">Current streak · best 14</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-text-secondary">This week</p>
          <div className="mt-2">
            <WeekSparkline data={MOCK.weekMinutes} />
          </div>
          <p className="mt-2 text-xs text-text-muted">
            {MOCK.weekMinutes.reduce((a, b) => a + b, 0)} min · 6 of 7 days
          </p>
        </div>
      </div>

      {/* XP bar */}
      <div className="mt-6">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium text-text-secondary">
            {MOCK.xpTotal.toLocaleString()} XP
            <span className="ml-1 text-accent">+{MOCK.xpToday} today</span>
          </span>
          <span className="text-xs text-text-muted">
            {MOCK.nextLevelXp - MOCK.xpTotal} XP to level {MOCK.level + 1}
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent-hover"
            style={{ width: `${levelPct}%` }}
          />
        </div>
      </div>

      {/* Kana mastery — JA-specific; generalize per language later */}
      <div className="mt-5 flex items-center justify-between gap-4 rounded-xl bg-surface-muted px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary">Hiragana mastery</p>
          <p className="text-xs text-text-secondary">17 of 46 kana confidently retained</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-text-primary">{MOCK.kanaMasteryPercent}%</p>
          <p className="text-[10px] uppercase tracking-wider text-text-muted">retention</p>
        </div>
      </div>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Flashcards tile                                                             */
/* ────────────────────────────────────────────────────────────────────────── */

function FlashcardsTile() {
  const langPath = useLangPath();
  return (
    <Card padding="md" className="h-full">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent">
          <Icon name="decks" size={22} aria-hidden />
        </span>
        <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warning">
          Due
        </span>
      </div>
      <p className="mt-3 text-sm font-medium text-text-secondary">Flashcards</p>
      <p className="text-3xl font-bold text-text-primary leading-none">
        {MOCK.cardsDue}
        <span className="ml-1 text-sm font-medium text-text-secondary">cards</span>
      </p>
      <div className="mt-3 flex items-center gap-1.5">
        {MOCK.cardsHotPreview.map((c) => (
          <span
            key={c}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface-muted text-sm font-bold text-text-primary"
          >
            {c}
          </span>
        ))}
        <span className="text-xs text-text-muted">+18</span>
      </div>
      <Link
        to={langPath("practice/flashcards/review")}
        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground transition hover:bg-accent-hover"
      >
        Review now
        <Icon name="chevronRight" size={16} aria-hidden />
      </Link>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Recent practice tile                                                        */
/* ────────────────────────────────────────────────────────────────────────── */

function RecentPracticeTile() {
  const langPath = useLangPath();
  return (
    <Link to={langPath(MOCK.recentPractice.href)} className="block h-full">
      <Card padding="md" className="group h-full transition hover:border-accent/60 hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-text-secondary transition group-hover:bg-accent-muted group-hover:text-accent">
            <Icon name={MOCK.recentPractice.iconName} size={22} aria-hidden />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            Recent
          </span>
        </div>
        <p className="mt-3 text-sm font-medium text-text-secondary">Continue practice</p>
        <p className="text-base font-semibold text-text-primary leading-tight">
          {MOCK.recentPractice.title}
        </p>
        <p className="mt-1 text-xs text-text-muted">{MOCK.recentPractice.subtitle}</p>
        <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-accent">
          Pick up where you left off
          <Icon
            name="chevronRight"
            size={16}
            className="transition group-hover:translate-x-0.5"
            aria-hidden
          />
        </div>
      </Card>
    </Link>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Quests                                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

function QuestRow({
  iconName,
  label,
  done,
  goal,
  xp,
}: {
  iconName: IconName;
  label: string;
  done: number;
  goal: number;
  xp: number;
}) {
  const pct = Math.min(100, Math.round((done / goal) * 100));
  const complete = done >= goal;
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          complete ? "bg-success/15 text-success" : "bg-accent-muted text-accent",
        )}
        aria-hidden
      >
        <Icon name={complete ? "check" : iconName} size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p
            className={cn(
              "truncate text-sm font-medium",
              complete ? "text-text-secondary line-through" : "text-text-primary",
            )}
          >
            {label}
          </p>
          <span className="shrink-0 text-xs font-semibold text-text-muted">
            {done}/{goal}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-muted">
          <div
            className={cn("h-full rounded-full", complete ? "bg-success" : "bg-accent")}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className="ml-1 shrink-0 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning">
        +{xp} XP
      </span>
    </div>
  );
}

function QuestsCard() {
  const wq = MOCK.weeklyQuest;
  const wqPct = Math.min(100, Math.round((wq.done / wq.goal) * 100));
  return (
    <Card padding="lg" className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Today</p>
          <h2 className="mt-1 text-lg font-semibold text-text-primary">Daily quests</h2>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-accent-muted px-2.5 py-1 text-xs font-bold text-accent">
          <Icon name="partyPopper" size={14} aria-hidden />
          Resets 11h
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {MOCK.dailyQuests.map((q) => (
          <QuestRow key={q.id} {...q} />
        ))}
      </div>

      {/* Weekly */}
      <div className="mt-auto rounded-xl border border-border bg-surface-muted p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Weekly goal
            </p>
            <p className="mt-0.5 text-sm font-semibold text-text-primary">{wq.label}</p>
          </div>
          <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning">
            +{wq.xp} XP
          </span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-accent-hover"
              style={{ width: `${wqPct}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-text-muted">
            {wq.done}/{wq.goal}
          </span>
        </div>
      </div>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Social column                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

function FriendAvatar({ name, status }: { name: string; status: "active" | "idle" }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="relative">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-muted text-sm font-bold text-accent">
        {initial}
      </span>
      <span
        className={cn(
          "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface",
          status === "active" ? "bg-success" : "bg-text-muted",
        )}
        aria-hidden
      />
    </div>
  );
}

function SocialCard() {
  const fq = MOCK.friendQuest;
  return (
    <Card padding="lg" className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Social</p>
          <h2 className="mt-1 text-lg font-semibold text-text-primary">Friends</h2>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full bg-accent-muted px-2.5 py-1 text-xs font-semibold text-accent transition hover:bg-accent/20"
        >
          <Icon name="plus" size={14} aria-hidden />
          Add
        </button>
      </div>

      {/* Friend streaks list */}
      <ul className="mt-5 space-y-3">
        {MOCK.friends.map((f) => (
          <li key={f.id} className="flex items-center gap-3">
            <FriendAvatar name={f.name} status={f.status} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text-primary">{f.name}</p>
              <p className="text-xs text-text-muted">
                {f.status === "active" ? "Active today" : "Idle"}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-bold text-warning">
              <Icon name="flame" size={12} aria-hidden />
              {f.streak}
            </span>
          </li>
        ))}
      </ul>

      {/* Friend quest */}
      <div className="mt-5 rounded-xl border border-border bg-surface-muted p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Friend quest
        </p>
        <p className="mt-1 text-sm font-semibold text-text-primary">{fq.label}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-surface px-3 py-2">
            <p className="text-text-muted">You</p>
            <p className="mt-0.5 font-bold text-text-primary">{fq.you}/1 ✓</p>
          </div>
          <div className="rounded-lg bg-surface px-3 py-2">
            <p className="text-text-muted">{fq.friendName}</p>
            <p className="mt-0.5 font-bold text-text-primary">{fq.friend}/1</p>
          </div>
        </div>
      </div>

      {/* Friend suggestion */}
      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Suggested for you
        </p>
        {MOCK.friendSuggestions.map((s) => (
          <div
            key={s.id}
            className="mt-2 flex items-center gap-3 rounded-xl border border-dashed border-border p-3"
          >
            <FriendAvatar name={s.name} status="idle" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text-primary">{s.name}</p>
              <p className="truncate text-xs text-text-muted">{s.reason}</p>
            </div>
            <button
              type="button"
              className="rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground transition hover:bg-accent-hover"
            >
              Follow
            </button>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-5">
        <button
          type="button"
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-secondary transition hover:bg-surface-muted hover:text-text-primary"
        >
          View leaderboard
          <Icon name="chevronRight" size={16} aria-hidden />
        </button>
      </div>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Community strip                                                             */
/* ────────────────────────────────────────────────────────────────────────── */

function CommunityStrip() {
  const langPath = useLangPath();
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-muted text-accent">
            <Icon name="globe" size={18} aria-hidden />
          </span>
          <h2 className="text-base font-semibold text-text-primary sm:text-lg">Community</h2>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={langPath("community/discuss")}
            className="text-sm font-medium text-accent hover:text-accent-hover"
          >
            Discussions
          </Link>
          <Link
            to={langPath("community/explore")}
            className="text-sm font-medium text-accent hover:text-accent-hover"
          >
            Browse decks
          </Link>
        </div>
      </div>
      <ul className="grid divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
        {MOCK.community.map((row) => (
          <li key={row.id}>
            <Link
              to={langPath("community/discuss")}
              className="group flex h-full items-start gap-3 px-5 py-4 transition hover:bg-surface-muted"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-text-secondary transition group-hover:bg-accent-muted group-hover:text-accent">
                <Icon name={row.iconName} size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    {row.kind}
                  </span>
                  {row.isNew ? (
                    <span className="rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-accent-foreground">
                      New
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 font-semibold leading-snug text-text-primary">{row.title}</p>
                <p className="mt-1 text-xs text-text-muted">{row.meta}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Page                                                                        */
/* ────────────────────────────────────────────────────────────────────────── */

export default function HomeRestructureMockup() {
  const { language } = useLanguage();
  const langConfig = language ? getLanguageConfig(language.id) : null;

  return (
    <div className="space-y-6">
      {/* Dev banner */}
      <div className="rounded-lg border border-dashed border-accent/40 bg-accent-muted/30 px-4 py-2 text-xs text-text-secondary">
        <span className="font-semibold text-accent">Mockup preview</span> — home-page restructure
        (2026-05-18). All data is static. Iterate visually here before committing to wiring.
      </div>

      <HeroSection langName={langConfig?.name ?? null} bgImage={langConfig?.backgroundImage} />

      {/* Main 3-column grid */}
      <div
        className="grid gap-5"
        style={{
          gridTemplateColumns: "minmax(0, 1fr)",
        }}
      >
        <div
          className="grid gap-5 lg:grid-cols-3"
          style={{
            gridTemplateAreas: `
              "account account social"
              "flash quests social"
              "recent quests social"
            `,
          }}
        >
          <div style={{ gridArea: "account" }} className="lg:col-span-2">
            <AccountOverviewCard />
          </div>
          <div style={{ gridArea: "social" }} className="lg:row-span-3">
            <SocialCard />
          </div>
          <div style={{ gridArea: "flash" }}>
            <FlashcardsTile />
          </div>
          <div style={{ gridArea: "quests" }} className="lg:row-span-2">
            <QuestsCard />
          </div>
          <div style={{ gridArea: "recent" }}>
            <RecentPracticeTile />
          </div>
        </div>

        <CommunityStrip />
      </div>

      {/* Notes for Spencer */}
      <details className="rounded-xl border border-dashed border-border bg-surface-muted px-4 py-3 text-sm text-text-secondary">
        <summary className="cursor-pointer font-semibold text-text-primary">
          Wiring notes (click to expand)
        </summary>
        <ul className="mt-3 space-y-2 text-xs leading-relaxed">
          <li>
            <b>Hero · continue lesson:</b> wire to existing <code>getNextLesson(course)</code> +
            module progress derived from <code>getMockCompletedLessonIds()</code> (already used in
            HomePage).
          </li>
          <li>
            <b>Account Overview:</b> streak/XP/daily-goal already live in{" "}
            <code>ProgressSummary</code>; just need the visual upgrade. Kana-mastery dial requires a
            language-specific stats source — start JA-only, gate by <code>language.id</code>.
          </li>
          <li>
            <b>Flashcards:</b> due count via <code>useCardsDueCount</code>. Hot-preview chips
            (front-of-card glyph) need a small "next N due" query on the SRS store.
          </li>
          <li>
            <b>Recent practice:</b> needs a small <code>lastPracticeAt</code> log (localStorage),
            populated when the user enters any practice route. Could be a tiny hook
            <code>useLastPractice()</code>.
          </li>
          <li>
            <b>Daily/Weekly quests:</b> greenfield. Mock-only this round. Real wiring later:
            quest-definition list + per-day progress derived from existing telemetry (lesson
            completion, flashcard reviews, minutes-practiced).
          </li>
          <li>
            <b>Social:</b> greenfield. No backend exists. Ship UI behind a feature flag
            <code>flags.social.home</code>; replace mock with API later.
          </li>
          <li>
            <b>Community strip:</b> reuse data from <code>HomeActivityPanel</code> (forum threads +
            new decks). Add an "article/post" kind once <code>flags.community.tabs.articles</code>
            exists.
          </li>
        </ul>
      </details>
    </div>
  );
}
