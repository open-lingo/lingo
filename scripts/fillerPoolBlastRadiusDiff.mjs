#!/usr/bin/env node
// Diff side of scripts/fillerPoolBlastRadius.ts — plain node, no vite-node
// needed since it only reads the two JSON dumps. See that file's header.
import { readFileSync } from "node:fs";

function diff(beforePath, afterPath) {
  const before = JSON.parse(readFileSync(beforePath, "utf8"));
  const after = JSON.parse(readFileSync(afterPath, "utf8"));
  const modules = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort(
    (a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10),
  );
  let totalFiller = 0,
    totalFillerChanged = 0,
    totalNonFiller = 0,
    totalNonFillerChanged = 0;
  const nonFillerChanges = [];
  const rows = [];
  for (const mod of modules) {
    const b = before[mod] ?? [];
    const a = after[mod] ?? [];
    const bSteps = new Map();
    for (const lesson of b) for (const s of lesson.steps) bSteps.set(`${lesson.id}::${s.id}`, s);
    const aSteps = new Map();
    for (const lesson of a) for (const s of lesson.steps) aSteps.set(`${lesson.id}::${s.id}`, s);
    let fillerN = 0,
      fillerChanged = 0,
      nonFillerN = 0,
      nonFillerChanged = 0;
    for (const [key, aStep] of aSteps) {
      const bStep = bSteps.get(key);
      if (aStep.isFiller) {
        fillerN++;
        if (!bStep || bStep.surface !== aStep.surface) fillerChanged++;
      } else {
        nonFillerN++;
        if (!bStep || bStep.surface !== aStep.surface) {
          nonFillerChanged++;
          nonFillerChanges.push(`${mod} ${key} (${aStep.type})`);
        }
      }
    }
    for (const [key, bStep] of bSteps) {
      if (aSteps.has(key)) continue;
      if (bStep.isFiller) fillerChanged++;
      else {
        nonFillerChanged++;
        nonFillerChanges.push(`${mod} ${key} (${bStep.type}) [REMOVED]`);
      }
    }
    totalFiller += fillerN;
    totalFillerChanged += fillerChanged;
    totalNonFiller += nonFillerN;
    totalNonFillerChanged += nonFillerChanged;
    rows.push({ mod, fillerN, fillerChanged, nonFillerN, nonFillerChanged });
  }
  console.log("module\tfiller_total\tfiller_changed\tnonfiller_total\tnonfiller_changed");
  for (const r of rows) {
    console.log(`${r.mod}\t${r.fillerN}\t${r.fillerChanged}\t${r.nonFillerN}\t${r.nonFillerChanged}`);
  }
  console.log("---");
  console.log(
    `TOTAL filler: ${totalFillerChanged}/${totalFiller} changed (${totalFiller ? ((totalFillerChanged / totalFiller) * 100).toFixed(1) : "0"}%)`,
  );
  console.log(`TOTAL non-filler changed: ${totalNonFillerChanged}/${totalNonFiller}`);
  if (nonFillerChanges.length) {
    console.log("NON-FILLER CHANGES (should be empty):");
    for (const c of nonFillerChanges) console.log(`  ${c}`);
  }
}

diff(process.argv[2], process.argv[3]);
