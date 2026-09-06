#!/usr/bin/env node
// iOS Simulator capture — REAL WebKit, real safe areas, real fonts.
//
// Prereqs (one-time per session):
//   1. dev server:  VITE_DEV_AUTH_BYPASS=true npx vite --port 5390 --strictPort
//   2. shell synced at it:  CAP_DEV_SERVER=http://localhost:5390/__sim npx cap sync ios
//   3. simulator build:  xcodebuild -project ios/App/App.xcodeproj -scheme App \
//        -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
//        -derivedDataPath <dd> CODE_SIGNING_ALLOWED=NO build
//
// The `/__sim` dev route (vite.config.ts) redirects each app launch to the
// path in /tmp/lingo-sim-target, so a capture = write target → relaunch → shoot.
//
// Usage:
//   node scripts/ux-loop/sim-capture.mjs --app <App.app> --out <dir> \
//     --devices "iPhone 15 Pro Max,iPhone 13" --routes routes.json [--wait 7]
// routes.json: [{ "label": "m30-3-s16", "route": "/ja/lessons/ja-m30-neo-3?step=16" }, …]

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const app = arg("app");
const out = arg("out", "artifacts/ux-loop/sim");
const devices = arg("devices", "iPhone 15 Pro Max").split(",").map((s) => s.trim());
const routes = JSON.parse(fs.readFileSync(arg("routes"), "utf8"));
const wait = Number(arg("wait", "7")) * 1000;
const BUNDLE = "com.linguiversal.app";
const TARGET = "/tmp/lingo-sim-target";

const simctl = (...a) => execFileSync("xcrun", ["simctl", ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function udidFor(name) {
  const list = JSON.parse(simctl("list", "devices", "available", "-j"));
  for (const devs of Object.values(list.devices)) {
    const d = devs.find((x) => x.name === name);
    if (d) return d;
  }
  throw new Error(`no simulator named ${name}`);
}

fs.mkdirSync(out, { recursive: true });
const manifest = [];
for (const name of devices) {
  const dev = udidFor(name);
  if (dev.state !== "Booted") {
    simctl("boot", dev.udid);
    simctl("bootstatus", dev.udid, "-b");
  }
  if (app) simctl("install", dev.udid, app);
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  for (const r of routes) {
    fs.writeFileSync(TARGET, r.route);
    try { simctl("terminate", dev.udid, BUNDLE); } catch { /* not running */ }
    simctl("launch", dev.udid, BUNDLE);
    await sleep(wait);
    const file = path.join(out, `${r.label}--${slug}.png`);
    simctl("io", dev.udid, "screenshot", file);
    manifest.push({ label: r.label, route: r.route, device: name, file });
    console.log(`${name}\t${r.label}\t${file}`);
  }
  if (arg("shutdown") === "1") simctl("shutdown", dev.udid);
}
fs.writeFileSync(path.join(out, "manifest.json"), JSON.stringify(manifest, null, 1));
