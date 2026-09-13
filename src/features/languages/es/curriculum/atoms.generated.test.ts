import { describe, it, expect } from "vitest";
import generated from "./atoms.generated.json";
import { buildEsAtomsAggregate } from "./atomsAggregate.eager";

describe("es atoms.generated.json", () => {
  it("matches the curriculum modules (run `npm run content:emit` if this fails)", () => {
    expect(generated).toEqual(JSON.parse(JSON.stringify(buildEsAtomsAggregate())));
  });
});
