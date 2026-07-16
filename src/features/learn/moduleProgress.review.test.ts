import { describe, expect, it } from "vitest";
import { getModuleStatus } from "./moduleProgress";
import type { CourseModule } from "@/shared/domain/course";

const mod = (id: string, lessonIds: string[]): CourseModule =>
  ({
    id,
    title: id,
    lessons: lessonIds.map((lid) => ({ id: lid, title: lid })),
  }) as CourseModule;

describe("review lessons don't gate module unlock", () => {
  it("ja review lessons are excluded (existing behavior)", () => {
    const modules = [mod("m3", ["ja-m3-1", "ja-m3-review-1"]), mod("m4", ["ja-m4-1"])];
    expect(getModuleStatus(1, new Set(["ja-m3-1"]), modules)).toBe("current");
  });

  it("ko review lessons are excluded (new)", () => {
    const modules = [mod("m2", ["ko-m2-ka-1", "ko-m2-review"]), mod("m3", ["ko-m3-1"])];
    expect(getModuleStatus(1, new Set(["ko-m2-ka-1"]), modules)).toBe("current");
  });

  it("ko mastery tests still gate", () => {
    const modules = [mod("m3", ["ko-m3-1", "ko-m3-8"]), mod("m4", ["ko-m4-1"])];
    expect(getModuleStatus(1, new Set(["ko-m3-1"]), modules)).toBe("locked");
  });
});
