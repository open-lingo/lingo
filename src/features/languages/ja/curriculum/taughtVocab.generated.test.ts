import { describe, it, expect } from "vitest";
import path from "node:path";
import generated from "./taughtVocab.generated.json";
import { projectTaughtVocab } from "./taughtVocabProjection";

describe("taughtVocab.generated.json", () => {
  it("matches the IR (run `npm run content:emit` if this fails)", () => {
    expect(generated).toEqual(projectTaughtVocab(path.resolve(__dirname, "ir")));
  });
});
