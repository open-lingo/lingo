// Polyfill import.meta.env for Node
if (!(globalThis as any).import_meta_env_set) {
  const origMeta = import.meta;
  Object.defineProperty(origMeta, 'env', { value: { VITE_DEV_AUTH_BYPASS: 'false', VITE_API_BASE_URL: '', MODE: 'test' }, configurable: true });
  (globalThis as any).import_meta_env_set = true;
}

import { MOCK_LESSON_JA_M1_L1A, MOCK_LESSON_JA_M1_L1B } from "./mock-ja-m1-l1.js";
import { MOCK_LESSON_JA_M1_KA_1, MOCK_LESSON_JA_M1_KA_2, MOCK_LESSON_JA_M1_KA_3 } from "./mock-ja-m1-ka.js";
import { MOCK_LESSON_JA_M1_SA_1, MOCK_LESSON_JA_M1_SA_2, MOCK_LESSON_JA_M1_SA_3 } from "./mock-ja-m1-sa.js";
import { MOCK_LESSON_JA_M1_TA_1, MOCK_LESSON_JA_M1_TA_2, MOCK_LESSON_JA_M1_TA_3 } from "./mock-ja-m1-ta.js";
import { MOCK_LESSON_JA_M1_NA_1, MOCK_LESSON_JA_M1_NA_2, MOCK_LESSON_JA_M1_NA_3 } from "./mock-ja-m1-na.js";
import { MOCK_LESSON_JA_M1_HA_1, MOCK_LESSON_JA_M1_HA_2, MOCK_LESSON_JA_M1_HA_3 } from "./mock-ja-m1-ha.js";
import { MOCK_LESSON_JA_M1_MA_1, MOCK_LESSON_JA_M1_MA_2, MOCK_LESSON_JA_M1_MA_3 } from "./mock-ja-m1-ma.js";
import { MOCK_LESSON_JA_M1_YA_1, MOCK_LESSON_JA_M1_YA_2, MOCK_LESSON_JA_M1_YA_3 } from "./mock-ja-m1-ya.js";
import { MOCK_LESSON_JA_M1_RA_1, MOCK_LESSON_JA_M1_RA_2, MOCK_LESSON_JA_M1_RA_3 } from "./mock-ja-m1-ra.js";
import { MOCK_LESSON_JA_M1_WA_1, MOCK_LESSON_JA_M1_WA_2, MOCK_LESSON_JA_M1_WA_3 } from "./mock-ja-m1-wa.js";
import { M3_1_1, M3_1_2, M3_2_1, M3_2_2, M3_3_1, M3_3_2, M3_4_1, M3_4_2, M3_5_1, M3_5_2, M3_6_1, M3_6_2, M3_7_1, M3_7_2, M3_8 } from "./mock-ja-m3-v2.js";
import { M4_1_1, M4_1_2, M4_2_1, M4_2_2, M4_3_1, M4_3_2, M4_4_1, M4_4_2, M4_5_1, M4_5_2, M4_6_1, M4_6_2, M4_7_1, M4_7_2 } from "./mock-ja-m4.js";
import { M5_1_1, M5_1_2, M5_2_1, M5_2_2, M5_3_1, M5_3_2, M5_4_1, M5_4_2, M5_5_1, M5_5_2, M5_6_1, M5_6_2, M5_7_1, M5_7_2 } from "./mock-ja-m5.js";
import { M6_1_1, M6_1_2, M6_2_1, M6_2_2, M6_3_1, M6_3_2, M6_4_1, M6_4_2, M6_5_1, M6_5_2, M6_6_1, M6_6_2, M6_7_1, M6_7_2, M6_8_1, M6_8_2 } from "./mock-ja-m6.js";
import { M7_1_1, M7_1_2, M7_2_1, M7_2_2, M7_3_1, M7_3_2, M7_4_1, M7_4_2, M7_5_1, M7_5_2, M7_6_1, M7_6_2, M7_7_1, M7_7_2, M7_8_1, M7_8_2 } from "./mock-ja-m7.js";

const TEACH_TYPES = new Set([
  "info",
  "phrase_card",
  "grammar_rule",
  "symbol_intro",
  "teach",
]);

function stats(lesson: any) {
  const steps = lesson.steps || [];
  const total = steps.length;
  const teach = steps.filter((s: any) => TEACH_TYPES.has(s.type)).length;
  return { total, teach, graded: total - teach };
}

function analyze(name: string, lesson: any) {
  const s = stats(lesson);
  const steps = lesson.steps || [];
  const types: Record<string, number> = {};
  for (const step of steps) {
    types[step.type] = (types[step.type] || 0) + 1;
  }
  const typesStr = Object.entries(types)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}:${v}`)
    .join(", ");
  console.log(`  ${name.padEnd(22)} total=${String(s.total).padStart(2)}, teach=${String(s.teach).padStart(2)}, graded=${String(s.graded).padStart(2)}  [${typesStr}]`);
}

console.log("=== MODULE 1 — Vowels (l1) ===");
analyze("L1A (1/2)", MOCK_LESSON_JA_M1_L1A);
analyze("L1B (2/2)", MOCK_LESSON_JA_M1_L1B);

console.log("\n=== MODULE 1 — Ka-row ===");
analyze("KA_1 (1/3)", MOCK_LESSON_JA_M1_KA_1);
analyze("KA_2 (2/3)", MOCK_LESSON_JA_M1_KA_2);
analyze("KA_3 (3/3)", MOCK_LESSON_JA_M1_KA_3);

console.log("\n=== MODULE 1 — Sa-row ===");
analyze("SA_1 (1/3)", MOCK_LESSON_JA_M1_SA_1);
analyze("SA_2 (2/3)", MOCK_LESSON_JA_M1_SA_2);
analyze("SA_3 (3/3)", MOCK_LESSON_JA_M1_SA_3);

console.log("\n=== MODULE 1 — Ta-row ===");
analyze("TA_1 (1/3)", MOCK_LESSON_JA_M1_TA_1);
analyze("TA_2 (2/3)", MOCK_LESSON_JA_M1_TA_2);
analyze("TA_3 (3/3)", MOCK_LESSON_JA_M1_TA_3);

console.log("\n=== MODULE 1 — Na-row ===");
analyze("NA_1 (1/3)", MOCK_LESSON_JA_M1_NA_1);
analyze("NA_2 (2/3)", MOCK_LESSON_JA_M1_NA_2);
analyze("NA_3 (3/3)", MOCK_LESSON_JA_M1_NA_3);

console.log("\n=== MODULE 1 — Ha-row ===");
analyze("HA_1 (1/3)", MOCK_LESSON_JA_M1_HA_1);
analyze("HA_2 (2/3)", MOCK_LESSON_JA_M1_HA_2);
analyze("HA_3 (3/3)", MOCK_LESSON_JA_M1_HA_3);

console.log("\n=== MODULE 1 — Ma-row ===");
analyze("MA_1 (1/3)", MOCK_LESSON_JA_M1_MA_1);
analyze("MA_2 (2/3)", MOCK_LESSON_JA_M1_MA_2);
analyze("MA_3 (3/3)", MOCK_LESSON_JA_M1_MA_3);

console.log("\n=== MODULE 1 — Ya-row ===");
analyze("YA_1 (1/3)", MOCK_LESSON_JA_M1_YA_1);
analyze("YA_2 (2/3)", MOCK_LESSON_JA_M1_YA_2);
analyze("YA_3 (3/3)", MOCK_LESSON_JA_M1_YA_3);

console.log("\n=== MODULE 1 — Ra-row ===");
analyze("RA_1 (1/3)", MOCK_LESSON_JA_M1_RA_1);
analyze("RA_2 (2/3)", MOCK_LESSON_JA_M1_RA_2);
analyze("RA_3 (3/3)", MOCK_LESSON_JA_M1_RA_3);

console.log("\n=== MODULE 1 — Wa-row ===");
analyze("WA_1 (1/3)", MOCK_LESSON_JA_M1_WA_1);
analyze("WA_2 (2/3)", MOCK_LESSON_JA_M1_WA_2);
analyze("WA_3 (3/3)", MOCK_LESSON_JA_M1_WA_3);

console.log("\n=== MODULE 3 ===");
analyze("M3_1_1", M3_1_1); analyze("M3_1_2", M3_1_2);
analyze("M3_2_1", M3_2_1); analyze("M3_2_2", M3_2_2);
analyze("M3_3_1", M3_3_1); analyze("M3_3_2", M3_3_2);
analyze("M3_4_1", M3_4_1); analyze("M3_4_2", M3_4_2);
analyze("M3_5_1", M3_5_1); analyze("M3_5_2", M3_5_2);
analyze("M3_6_1", M3_6_1); analyze("M3_6_2", M3_6_2);
analyze("M3_7_1", M3_7_1); analyze("M3_7_2", M3_7_2);
analyze("M3_8 (row test)", M3_8);

console.log("\n=== MODULE 4 ===");
analyze("M4_1_1", M4_1_1);
analyze("M4_1_2", M4_1_2);
analyze("M4_2_1", M4_2_1);
analyze("M4_2_2", M4_2_2);
analyze("M4_3_1", M4_3_1);
analyze("M4_3_2", M4_3_2);
analyze("M4_4_1", M4_4_1);
analyze("M4_4_2", M4_4_2);
analyze("M4_5_1", M4_5_1);
analyze("M4_5_2", M4_5_2);
analyze("M4_6_1", M4_6_1);
analyze("M4_6_2", M4_6_2);
analyze("M4_7_1", M4_7_1);
analyze("M4_7_2", M4_7_2);

console.log("\n=== MODULE 5 ===");
analyze("M5_1_1", M5_1_1);
analyze("M5_1_2", M5_1_2);
analyze("M5_2_1", M5_2_1);
analyze("M5_2_2", M5_2_2);
analyze("M5_3_1", M5_3_1);
analyze("M5_3_2", M5_3_2);
analyze("M5_4_1", M5_4_1);
analyze("M5_4_2", M5_4_2);
analyze("M5_5_1", M5_5_1);
analyze("M5_5_2", M5_5_2);
analyze("M5_6_1", M5_6_1);
analyze("M5_6_2", M5_6_2);
analyze("M5_7_1", M5_7_1);
analyze("M5_7_2", M5_7_2);

console.log("\n=== MODULE 6 ===");
analyze("M6_1_1", M6_1_1);
analyze("M6_1_2", M6_1_2);
analyze("M6_2_1", M6_2_1);
analyze("M6_2_2", M6_2_2);
analyze("M6_3_1", M6_3_1);
analyze("M6_3_2", M6_3_2);
analyze("M6_4_1", M6_4_1);
analyze("M6_4_2", M6_4_2);
analyze("M6_5_1", M6_5_1);
analyze("M6_5_2", M6_5_2);
analyze("M6_6_1", M6_6_1);
analyze("M6_6_2", M6_6_2);
analyze("M6_7_1", M6_7_1);
analyze("M6_7_2", M6_7_2);
analyze("M6_8_1", M6_8_1);
analyze("M6_8_2", M6_8_2);

console.log("\n=== MODULE 7 ===");
analyze("M7_1_1", M7_1_1);
analyze("M7_1_2", M7_1_2);
analyze("M7_2_1", M7_2_1);
analyze("M7_2_2", M7_2_2);
analyze("M7_3_1", M7_3_1);
analyze("M7_3_2", M7_3_2);
analyze("M7_4_1", M7_4_1);
analyze("M7_4_2", M7_4_2);
analyze("M7_5_1", M7_5_1);
analyze("M7_5_2", M7_5_2);
analyze("M7_6_1", M7_6_1);
analyze("M7_6_2", M7_6_2);
analyze("M7_7_1", M7_7_1);
analyze("M7_7_2", M7_7_2);
analyze("M7_8_1", M7_8_1);
analyze("M7_8_2", M7_8_2);

// Summary
console.log("\n\n========== SUMMARY TABLE ==========\n");
console.log("Module | Content SLs | Avg Total | Avg Graded | Avg Teach | Graded Range | Teach%");
console.log("-------|-------------|-----------|------------|-----------|--------------|-------");

const modules: Record<string, any[]> = {
  "M1": [
    MOCK_LESSON_JA_M1_L1A, MOCK_LESSON_JA_M1_L1B,
    MOCK_LESSON_JA_M1_KA_1, MOCK_LESSON_JA_M1_KA_2, MOCK_LESSON_JA_M1_KA_3,
    MOCK_LESSON_JA_M1_SA_1, MOCK_LESSON_JA_M1_SA_2, MOCK_LESSON_JA_M1_SA_3,
    MOCK_LESSON_JA_M1_TA_1, MOCK_LESSON_JA_M1_TA_2, MOCK_LESSON_JA_M1_TA_3,
    MOCK_LESSON_JA_M1_NA_1, MOCK_LESSON_JA_M1_NA_2, MOCK_LESSON_JA_M1_NA_3,
    MOCK_LESSON_JA_M1_HA_1, MOCK_LESSON_JA_M1_HA_2, MOCK_LESSON_JA_M1_HA_3,
    MOCK_LESSON_JA_M1_MA_1, MOCK_LESSON_JA_M1_MA_2, MOCK_LESSON_JA_M1_MA_3,
    MOCK_LESSON_JA_M1_YA_1, MOCK_LESSON_JA_M1_YA_2, MOCK_LESSON_JA_M1_YA_3,
    MOCK_LESSON_JA_M1_RA_1, MOCK_LESSON_JA_M1_RA_2, MOCK_LESSON_JA_M1_RA_3,
    MOCK_LESSON_JA_M1_WA_1, MOCK_LESSON_JA_M1_WA_2, MOCK_LESSON_JA_M1_WA_3,
  ],
  "M3": [M3_1_1, M3_1_2, M3_2_1, M3_2_2, M3_3_1, M3_3_2, M3_4_1, M3_4_2, M3_5_1, M3_5_2, M3_6_1, M3_6_2, M3_7_1, M3_7_2, M3_8],
  "M4": [M4_1_1, M4_1_2, M4_2_1, M4_2_2, M4_3_1, M4_3_2, M4_4_1, M4_4_2, M4_5_1, M4_5_2, M4_6_1, M4_6_2, M4_7_1, M4_7_2],
  "M5": [M5_1_1, M5_1_2, M5_2_1, M5_2_2, M5_3_1, M5_3_2, M5_4_1, M5_4_2, M5_5_1, M5_5_2, M5_6_1, M5_6_2, M5_7_1, M5_7_2],
  "M6": [M6_1_1, M6_1_2, M6_2_1, M6_2_2, M6_3_1, M6_3_2, M6_4_1, M6_4_2, M6_5_1, M6_5_2, M6_6_1, M6_6_2, M6_7_1, M6_7_2, M6_8_1, M6_8_2],
  "M7": [M7_1_1, M7_1_2, M7_2_1, M7_2_2, M7_3_1, M7_3_2, M7_4_1, M7_4_2, M7_5_1, M7_5_2, M7_6_1, M7_6_2, M7_7_1, M7_7_2, M7_8_1, M7_8_2],
};

for (const [mod, lessons] of Object.entries(modules)) {
  const allStats = lessons.map(l => stats(l));
  // Exclude row tests (total <= 5 steps)
  const contentStats = allStats.filter(s => s.total > 5);
  
  const totals = contentStats.map(s => s.total);
  const graded = contentStats.map(s => s.graded);
  const teach = contentStats.map(s => s.teach);
  
  if (totals.length === 0) {
    console.log(`${mod.padEnd(6)} | ${String(lessons.length).padStart(11)} | N/A`);
    continue;
  }
  
  const avgTotal = (totals.reduce((a,b)=>a+b,0) / totals.length).toFixed(1);
  const avgGraded = (graded.reduce((a,b)=>a+b,0) / graded.length).toFixed(1);
  const avgTeach = (teach.reduce((a,b)=>a+b,0) / teach.length).toFixed(1);
  const minGraded = Math.min(...graded);
  const maxGraded = Math.max(...graded);
  const teachPct = (Number(avgTeach)/Number(avgTotal)*100).toFixed(0);
  
  console.log(`${mod.padEnd(6)} | ${String(contentStats.length).padStart(11)} | ${avgTotal.padStart(9)} | ${avgGraded.padStart(10)} | ${avgTeach.padStart(9)} | ${String(minGraded + "-" + maxGraded).padStart(12)} | ${teachPct.padStart(5)}%`);
}

// Detailed per-lesson graded step analysis
console.log("\n\n========== GRADED STEP COUNTS (non-teach) PER SUB-LESSON ==========\n");

const detailedModules: Record<string, {name: string, lesson: any}[]> = {
  "M3": [
    {name:"M3-1-1", lesson: M3_1_1}, {name:"M3-1-2", lesson: M3_1_2},
    {name:"M3-2-1", lesson: M3_2_1}, {name:"M3-2-2", lesson: M3_2_2},
    {name:"M3-3-1", lesson: M3_3_1}, {name:"M3-3-2", lesson: M3_3_2},
    {name:"M3-4-1", lesson: M3_4_1}, {name:"M3-4-2", lesson: M3_4_2},
    {name:"M3-5-1", lesson: M3_5_1}, {name:"M3-5-2", lesson: M3_5_2},
    {name:"M3-6-1", lesson: M3_6_1}, {name:"M3-6-2", lesson: M3_6_2},
    {name:"M3-7-1", lesson: M3_7_1}, {name:"M3-7-2", lesson: M3_7_2},
    {name:"M3-8(test)", lesson: M3_8}
  ],
  "M4": [
    {name:"M4-1-1", lesson: M4_1_1}, {name:"M4-1-2", lesson: M4_1_2},
    {name:"M4-2-1", lesson: M4_2_1}, {name:"M4-2-2", lesson: M4_2_2},
    {name:"M4-3-1", lesson: M4_3_1}, {name:"M4-3-2", lesson: M4_3_2},
    {name:"M4-4-1", lesson: M4_4_1}, {name:"M4-4-2", lesson: M4_4_2},
    {name:"M4-5-1", lesson: M4_5_1}, {name:"M4-5-2", lesson: M4_5_2},
    {name:"M4-6-1", lesson: M4_6_1}, {name:"M4-6-2", lesson: M4_6_2},
    {name:"M4-7-1", lesson: M4_7_1}, {name:"M4-7-2", lesson: M4_7_2}
  ],
  "M5": [
    {name:"M5-1-1", lesson: M5_1_1}, {name:"M5-1-2", lesson: M5_1_2},
    {name:"M5-2-1", lesson: M5_2_1}, {name:"M5-2-2", lesson: M5_2_2},
    {name:"M5-3-1", lesson: M5_3_1}, {name:"M5-3-2", lesson: M5_3_2},
    {name:"M5-4-1", lesson: M5_4_1}, {name:"M5-4-2", lesson: M5_4_2},
    {name:"M5-5-1", lesson: M5_5_1}, {name:"M5-5-2", lesson: M5_5_2},
    {name:"M5-6-1", lesson: M5_6_1}, {name:"M5-6-2", lesson: M5_6_2},
    {name:"M5-7-1", lesson: M5_7_1}, {name:"M5-7-2", lesson: M5_7_2}
  ],
  "M6": [
    {name:"M6-1-1", lesson: M6_1_1}, {name:"M6-1-2", lesson: M6_1_2},
    {name:"M6-2-1", lesson: M6_2_1}, {name:"M6-2-2", lesson: M6_2_2},
    {name:"M6-3-1", lesson: M6_3_1}, {name:"M6-3-2", lesson: M6_3_2},
    {name:"M6-4-1", lesson: M6_4_1}, {name:"M6-4-2", lesson: M6_4_2},
    {name:"M6-5-1", lesson: M6_5_1}, {name:"M6-5-2", lesson: M6_5_2},
    {name:"M6-6-1", lesson: M6_6_1}, {name:"M6-6-2", lesson: M6_6_2},
    {name:"M6-7-1", lesson: M6_7_1}, {name:"M6-7-2", lesson: M6_7_2},
    {name:"M6-8-1", lesson: M6_8_1}, {name:"M6-8-2", lesson: M6_8_2}
  ],
  "M7": [
    {name:"M7-1-1", lesson: M7_1_1}, {name:"M7-1-2", lesson: M7_1_2},
    {name:"M7-2-1", lesson: M7_2_1}, {name:"M7-2-2", lesson: M7_2_2},
    {name:"M7-3-1", lesson: M7_3_1}, {name:"M7-3-2", lesson: M7_3_2},
    {name:"M7-4-1", lesson: M7_4_1}, {name:"M7-4-2", lesson: M7_4_2},
    {name:"M7-5-1", lesson: M7_5_1}, {name:"M7-5-2", lesson: M7_5_2},
    {name:"M7-6-1", lesson: M7_6_1}, {name:"M7-6-2", lesson: M7_6_2},
    {name:"M7-7-1", lesson: M7_7_1}, {name:"M7-7-2", lesson: M7_7_2},
    {name:"M7-8-1", lesson: M7_8_1}, {name:"M7-8-2", lesson: M7_8_2}
  ],
};

for (const [mod, items] of Object.entries(detailedModules)) {
  const gradedCounts = items.filter(i => !i.name.includes("test")).map(i => {
    const s = stats(i.lesson);
    return `${i.name}=${s.graded}`;
  });
  console.log(`${mod}: ${gradedCounts.join(", ")}`);
}
