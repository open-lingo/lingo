import { chromium } from "@playwright/test";
const b = await chromium.launch();
const p = await (await b.newContext()).newPage();
await p.goto("http://localhost:5197", { waitUntil: "domcontentloaded", timeout: 60000 });
const out = await p.evaluate(async () => {
  const tts = await import("/src/shared/tts/index.ts");
  const ml  = await import("/src/features/lesson/data/mockLessons.ts");
  const mc  = await import("/src/shared/domain/mockCourse.ts");
  const res = {};
  for (const lang of ["ja","ko","es"]) {
    let course; try { course = mc.getMockCourse(lang); } catch { continue; }
    const ids=[]; for (const m of course.modules) for (const l of (m.lessons??[])) ids.push(l.id);
    let spoken=0, covered=0;
    // Sample a spread of lessons per language.
    const step = Math.max(1, Math.floor(ids.length/25));
    for (const id of ids.filter((_,i)=>i%step===0).slice(0,25)) {
      let steps; try { steps = ml.getMockLessonContent(id)?.steps; } catch { continue; }
      if (!steps) continue;
      // "spoken" = fields the step views actually feed to the resolver.
      const walk=(v)=>{ if(!v||typeof v!=="object")return;
        if(Array.isArray(v)){v.forEach(walk);return;}
        for(const [k,c] of Object.entries(v)){
          if(typeof c==="string" && c && c.length<=200 &&
             ["audioText","transcript","promptAudioText","targetPhrase","targetSentence","symbol","answer"].includes(k)){
            spoken++; if (tts.getTtsUrl(c, lang)) covered++;
          }
          walk(c);
        }};
      walk(steps);
    }
    res[lang] = { spoken, covered, pct: spoken ? Math.round(covered/spoken*100) : 0 };
  }
  return res;
});
for (const [lang,s] of Object.entries(out))
  console.log(`  ${lang}: ${s.covered}/${s.spoken} spoken surfaces have a recording (${s.pct}%)`);
await b.close();
