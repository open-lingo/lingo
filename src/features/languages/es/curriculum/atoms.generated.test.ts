import { describe, it, expect } from "vitest";
import generated from "./atoms.generated.json";
import { buildEsAtomsAggregate } from "./atomsAggregate.eager";

describe("es atoms.generated.json", () => {
  // Vacuity sweep 2026-09-17 (lane A5c): a deepEqual against a live build
  // output still passes if BOTH sides collapse to an empty array (a broken
  // import, an accidentally-emptied curriculum) — the drift check would
  // never fire. Pin the collection non-empty first so that shape of failure
  // reads as its own reason instead of a silent, vacuous PASS.
  it("the aggregate is non-empty", () => {
    expect(generated.length).toBeGreaterThan(0);
  });

  it("matches the curriculum modules (run `npm run content:emit` if this fails)", () => {
    expect(generated).toEqual(JSON.parse(JSON.stringify(buildEsAtomsAggregate())));
  });
});
