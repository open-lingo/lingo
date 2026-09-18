#!/usr/bin/env node
// Pull TestFlight screenshot + crash feedback for the app into <outDir>.
// Usage: node scripts/asc/pull-feedback.mjs [outDir]   (default: ./testflight-feedback)
// Needs ~/.appstoreconnect/credentials.env (ISSUER_ID, KEY_ID) + the .p8 key.
// Writes manifest.json (chronological, oldest first) and NN.jpg screenshots.
// Screenshot URLs are signed and expire after ~5 days, so re-run rather than save URLs.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = '6805652204';
const out = process.argv[2] ?? 'testflight-feedback';
const asc = join(dirname(fileURLToPath(import.meta.url)), 'asc.mjs');
const get = (p) => JSON.parse(execFileSync('node', [asc, p], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));

mkdirSync(out, { recursive: true });
const builds = Object.fromEntries(get(`/v1/apps/${APP}/builds?fields[builds]=version&limit=200`).data.map((b) => [b.id, b.attributes.version]));
const crashes = get(`/v1/apps/${APP}/betaFeedbackCrashSubmissions?limit=200`);
const shots = get(`/v1/apps/${APP}/betaFeedbackScreenshotSubmissions?limit=200&include=build,tester`);
const rows = shots.data.slice().reverse().map((s, i) => ({
  n: i + 1, id: s.id, createdDate: s.attributes.createdDate, build: builds[s.relationships.build.data.id],
  device: s.attributes.deviceModel, os: s.attributes.osVersion, tester: s.relationships.tester.data.id,
  comment: s.attributes.comment, screenshots: s.attributes.screenshots.length,
}));
for (const [i, s] of shots.data.slice().reverse().entries()) {
  for (const [j, sc] of s.attributes.screenshots.entries()) {
    const buf = Buffer.from(await (await fetch(sc.url)).arrayBuffer());
    writeFileSync(join(out, `${String(i + 1).padStart(2, '0')}${j ? `-${j + 1}` : ''}.jpg`), buf);
  }
}
writeFileSync(join(out, 'manifest.json'), JSON.stringify({ crashes: crashes.data, screenshots: rows }, null, 1));
console.log(`crashes: ${crashes.data.length}  screenshots: ${rows.length}  -> ${out}/`);
for (const r of rows) console.log(`${r.n}\tb${r.build}\t${r.device}\t${r.createdDate}\t${(r.comment ?? "(no comment)").replace(/\s+/g, " ")}`);
