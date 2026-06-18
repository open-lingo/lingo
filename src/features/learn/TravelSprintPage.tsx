import { useNavigate } from "react-router-dom";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { Icon } from "@/shared/components/Icon";
import { getMockCompletedLessonIds } from "@/shared/domain/mockProgress";

type SprintLesson = {
  id: string;
  lessonId: string;
  emoji: string;
  title: string;
  subtitle: string;
  phrases: string[];
};

const SPRINT_LESSONS: SprintLesson[] = [
  {
    id: "navigation",
    lessonId: "ja-sidequest-travel-navigation",
    emoji: "🚃",
    title: "Getting Around",
    subtitle: "Trains, taxis, directions",
    phrases: ["sumimasen", "eki wa doko", "migi / hidari"],
  },
  {
    id: "ordering",
    lessonId: "ja-sidequest-travel-ordering",
    emoji: "🍜",
    title: "Ordering Food",
    subtitle: "Restaurants, cafes, menus",
    phrases: ["kore o kudasai", "omizu", "okaikei"],
  },
  {
    id: "help",
    lessonId: "ja-sidequest-travel-help",
    emoji: "🆘",
    title: "Getting Help",
    subtitle: "Lost, confused, emergencies",
    phrases: ["wakarimasen", "eigo", "chotto matte"],
  },
  {
    id: "shopping",
    lessonId: "ja-sidequest-travel-shopping",
    emoji: "🛍️",
    title: "Shopping",
    subtitle: "Prices, paying, bags",
    phrases: ["ikura desu ka", "kaado", "fukuro"],
  },
];

export default function TravelSprintPage() {
  const navigate = useNavigate();
  const langPath = useLangPath();
  const completed = new Set(getMockCompletedLessonIds());
  const completedCount = SPRINT_LESSONS.filter((l) =>
    completed.has(l.lessonId),
  ).length;

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
      <button
        type="button"
        onClick={() => navigate(langPath("learn"))}
        className="flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text-primary"
      >
        <Icon name="arrowLeft" size={16} />
        Back to lessons
      </button>

      <div className="text-center">
        <span className="inline-flex text-accent" aria-hidden>
          <Icon name="plane" size={48} />
        </span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-text-primary">
          Travel Sprint
        </h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Pimsleur-style audio drills for real travel scenarios. Listen, understand, speak.
        </p>
        {completedCount > 0 && (
          <p className="mt-2 text-xs font-medium text-accent">
            {completedCount} of {SPRINT_LESSONS.length} completed
          </p>
        )}
      </div>

      <div className="space-y-3">
        {SPRINT_LESSONS.map((lesson) => {
          const done = completed.has(lesson.lessonId);
          return (
            <button
              key={lesson.id}
              type="button"
              onClick={() =>
                navigate(langPath(`learn/lessons/${lesson.lessonId}`))
              }
              className={`w-full rounded-card border-2 px-5 py-4 text-left transition-colors ${
                done
                  ? "border-accent/40 bg-accent-muted/40"
                  : "border-border bg-surface hover:border-accent"
              }`}
            >
              <div className="flex items-start gap-4">
                <span className="mt-0.5 text-3xl">{lesson.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-text-primary">
                      {lesson.title}
                    </h3>
                    {done && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        Done
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-text-muted">
                    {lesson.subtitle}
                  </p>
                  <p className="mt-2 text-xs text-text-secondary">
                    {lesson.phrases.map((p, i) => (
                      <span key={p}>
                        {i > 0 && " · "}
                        <span className="font-medium">{p}</span>
                      </span>
                    ))}
                  </p>
                </div>
                <Icon
                  name="arrowBigRight"
                  size={20}
                  className="mt-2 shrink-0 text-text-muted"
                />
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-text-muted">
        ~3-4 min each · audio-first · speak to practice
      </p>
    </div>
  );
}
