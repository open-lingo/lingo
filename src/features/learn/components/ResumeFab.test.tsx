/**
 * ResumeFab — links to the first incomplete lesson of the current module,
 * uses the alphabet-lesson route shape when the target is an alphabet
 * lesson, and renders nothing when the course has no lessons.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { Course } from "@/shared/domain/course";
import { ResumeFab } from "./ResumeFab";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, opts?: { defaultValue?: string } & Record<string, unknown>) => {
      const dv = opts?.defaultValue ?? k;
      return typeof opts?.lesson === "string" ? dv.replace("{{lesson}}", opts.lesson) : dv;
    },
  }),
}));

vi.mock("@/shared/hooks/useLangPath", () => ({
  useLangPath: () => (p: string) => `/ja/${p}`,
}));

afterEach(() => cleanup());

const course: Course = {
  id: "mock",
  title: "Japanese",
  languageId: "ja",
  modules: [
    { id: "m1", title: "M1", lessons: [{ id: "ja-m1-a", title: "A" }, { id: "ja-m1-b", title: "B" }] },
    { id: "m2", title: "M2", lessons: [{ id: "ja-m2-a", title: "C" }] },
  ],
} as Course;

function renderFab(completed: string[]) {
  return render(
    <MemoryRouter>
      <ResumeFab course={course} completedSet={new Set(completed)} />
    </MemoryRouter>,
  );
}

describe("ResumeFab", () => {
  it("links to the first incomplete lesson of the current module", () => {
    renderFab(["ja-m1-a"]);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/ja/learn/lessons/ja-m1-b");
    expect(link).toHaveTextContent("B");
  });

  it("uses the alphabet route shape for alphabet lessons", () => {
    const alphaCourse = {
      ...course,
      modules: [
        {
          id: "m1",
          title: "M1",
          lessons: [{ id: "ja-m1-hira", title: "Hiragana", kind: "alphabet", alphabetId: "hiragana" }],
        },
      ],
    } as Course;
    render(
      <MemoryRouter>
        <ResumeFab course={alphaCourse} completedSet={new Set()} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/ja/practice/alphabet/hiragana/learn",
    );
  });

  it("renders nothing when there are no lessons", () => {
    const empty = { ...course, modules: [{ id: "m1", title: "M1", lessons: [] }] } as Course;
    const { container } = render(
      <MemoryRouter>
        <ResumeFab course={empty} completedSet={new Set()} />
      </MemoryRouter>,
    );
    expect(container.firstChild).toBeNull();
  });
});
