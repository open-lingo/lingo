import { it } from "vitest";
import { writeFileSync } from "node:fs";
import { gateResidual } from "@/features/practice/content/gate";

const OUT =
  "/tmp/claude-1000/-home-trevor-projects-open-lingo-docs/58ded05d-39ac-421c-87e5-1e8403ec94cb/scratchpad/probe2.txt";

const CASES: [string, number, string][] = [
  ["ko", 7, "저도 밥을 먹어요."],
  ["ko", 7, "밥이 여기에 있어요. 영화도 봐요?"],
  ["ko", 16, "저는 빵을 좋아해요. 커피도 좋아해요."],
  ["ko", 18, "네. 내일은 비도 안 올 거예요."],
  ["ko", 19, "아니요, 회사에 가요. 우리 누나가 학생이에요."],
  ["ko", 20, "네, 알겠어요. 오늘은 학교에 안 가요."],
  ["ko", 27, "하지만 내일은 시험이 있어요."],
];

it("probe", () => {
  const lines = CASES.map(([lang, m, text]) => {
    const r = gateResidual(text, lang, m);
    return `${r === "" ? "OK  " : "FAIL"} ${lang} m${m} ${r ? `[${r}] ` : ""}${text}`;
  });
  writeFileSync(OUT, lines.join("\n"));
});
