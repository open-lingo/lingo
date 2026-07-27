import { describe, it } from "vitest";
import { writeFileSync } from "node:fs";
import { conjugateVerb } from "../conjugationEngine";
import { transformDrillDistractors } from "../grammarHelpers";

describe("probe2", () => {
  it("conjugates", () => {
    const lines: string[] = [];
    const cases: [string, "ichidan" | "godan" | "irregular"][] = [
      ["たべる", "ichidan"],
      ["みる", "ichidan"],
      ["おしえる", "ichidan"],
      ["のむ", "godan"],
      ["かう", "godan"],
      ["きく", "godan"],
      ["あそぶ", "godan"],
      ["いく", "godan"],
      ["わかる", "godan"],
      ["しる", "godan"],
      ["うる", "godan"],
      ["はたらく", "godan"],
      ["する", "irregular"],
      ["くる", "irregular"],
    ];
    for (const [d, g] of cases) {
      const ta = conjugateVerb(d, g, "ta");
      const mp = conjugateVerb(d, g, "masu-past");
      let dist = "ERR";
      try {
        dist = transformDrillDistractors(d, g, "ta", ta, new Set()).join(",");
      } catch (e) {
        dist = String(e);
      }
      lines.push(`${d}\t${g}\tta=${ta}\tmasu-past=${mp}\tdist=${dist}`);
    }
    writeFileSync("/tmp/conj.txt", lines.join("\n"));
  });
});
