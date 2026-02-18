import type { Course } from "@/core/course";
import { getLanguageConfig } from "@/core/languageConfig";

/** Mock course for the selected language. Replace with API when ready. */
export function getMockCourse(languageId: string): Course {
  const config = getLanguageConfig(languageId);
  const langName = config?.name ?? "Language";

  const introLesson = config?.introLessonTitle
    ? [{ id: "m1-l0", title: config.introLessonTitle, status: "available" as const }]
    : [];

  return {
    id: "mock-1",
    title: `${langName} for Beginners`,
    languageId,
    modules: [
      {
        id: "m1",
        title: "Basics",
        lessons: [
          ...introLesson,
          { id: "m1-l1", title: "Greetings", status: "available" as const },
          { id: "m1-l2", title: "Numbers 1–10", status: "available" as const },
          { id: "m1-l3", title: "Colors", status: "locked" as const },
        ],
      },
      {
        id: "m2",
        title: "Everyday phrases",
        lessons: [
          { id: "m2-l1", title: "Please and thank you", status: "available" },
          { id: "m2-l2", title: "Asking for directions", status: "locked" },
          { id: "m2-l3", title: "At the market", status: "locked" },
        ],
      },
      {
        id: "m3",
        title: "Grammar foundations",
        lessons: [
          { id: "m3-l1", title: "Simple present", status: "locked" },
          { id: "m3-l2", title: "Questions", status: "locked" },
        ],
      },
    ],
  };
}
