import { describe, it, expect } from "vitest";
import generated from "./placement.generated.json";
import { buildEsPlacementAggregate } from "./placementAggregate.eager";

describe("es placement.generated.json", () => {
  it("matches the curriculum modules (run `npm run content:emit` if this fails)", () => {
    expect(generated).toEqual(JSON.parse(JSON.stringify(buildEsPlacementAggregate())));
  });
});
