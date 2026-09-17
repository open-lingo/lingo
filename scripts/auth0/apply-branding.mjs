#!/usr/bin/env node
/**
 * Applies scripts/auth0/universal-login-branding.json (colors/logo/favicon/
 * font — the same fields the dashboard's Branding → Universal Login →
 * Colors/General page exposes) and, optionally, scripts/auth0/
 * tenant-settings.json (friendly_name/picture_url — the tenant-wide display
 * name shown before any per-app branding resolves) to the Auth0 tenant.
 * With --template, also PUTs scripts/auth0/page-template.html as the
 * Universal Login page template — that call needs a verified custom domain
 * (login.openlingoapp.com) and returns 402/404 without one; see
 * docs/auth-branding-2026-09-17.md.
 *
 * Auth, tried in this order — NEVER fabricates a token, NEVER reads
 * `.env*` or `~/.claude/**`:
 *
 *   1. AUTH0_MGMT_TOKEN + AUTH0_DOMAIN env vars → direct Management API
 *      calls via fetch(). Get a token: Dashboard → Applications → APIs →
 *      Auth0 Management API → Test tab (or a machine-to-machine app
 *      authorized for the fields this script touches: branding, tenant
 *      settings). Short-lived — this is the "management token" path Spencer
 *      runs by hand.
 *   2. No token, but the `auth0` CLI (v1.33+, already installed) reports an
 *      active session → `auth0 api patch branding` / `auth0 api patch
 *      tenants/settings` / `auth0 api put branding/templates/universal-login`,
 *      piping each JSON/HTML body over stdin (the CLI's own --help documents
 *      stdin as the alternative to --data; a literal `--data @file` is NOT
 *      something the CLI parses — it would send the 6 characters `@file`).
 *      This is the path used for the actual apply — see
 *      scripts/auth0/rollback/2026-09-17.
 *   3. Neither → prints the exact dashboard steps and exits 0. This is the
 *      expected path until one of the above is available.
 *
 * Usage:
 *   node scripts/auth0/apply-branding.mjs                  # branding only
 *   node scripts/auth0/apply-branding.mjs --tenant-settings # + tenant display name/logo
 *   node scripts/auth0/apply-branding.mjs --template        # + page template (needs custom domain)
 *   node scripts/auth0/apply-branding.mjs --dry-run         # print what would be sent, change nothing
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const DIR = path.join(ROOT, "scripts/auth0");
const BRANDING_FILE = path.join(DIR, "universal-login-branding.json");
const TENANT_SETTINGS_FILE = path.join(DIR, "tenant-settings.json");
const TEMPLATE_FILE = path.join(DIR, "page-template.html");
const ROLLBACK_DIR = path.join(DIR, "rollback");

const args = new Set(process.argv.slice(2));
const applyTemplate = args.has("--template");
const applyTenantSettings = args.has("--tenant-settings");
const dryRun = args.has("--dry-run");

function loadJson(file) {
  const raw = JSON.parse(readFileSync(file, "utf8"));
  // Strip our own documentation keys — never send them to the API.
  const { _comment, ...body } = raw;
  return body;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// A same-day rollback file is the tenant's state BEFORE the first apply run
// of the day — the actual baseline anyone reaching for "rollback" wants.
// A second run today (e.g. fixing a typo in the JSON before Spencer signs
// off) must NOT overwrite it with the already-half-applied state, or the
// file stops being a rollback at all. Skip, don't clobber; --force-snapshot
// is the explicit escape hatch for "no, really, snapshot right now".
function saveRollback(name, data) {
  mkdirSync(ROLLBACK_DIR, { recursive: true });
  const file = path.join(ROLLBACK_DIR, `${name}-${today()}.json`);
  if (existsSync(file) && !args.has("--force-snapshot")) {
    console.log(
      `  ${path.relative(ROOT, file)} already exists — leaving it (today's ` +
        `baseline). Pass --force-snapshot to overwrite it with the current state.`,
    );
    return;
  }
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  console.log(`  saved current state → ${path.relative(ROOT, file)}`);
}

// ── Auth path 1: direct Management API token ────────────────────────────
async function viaManagementToken(domain, token) {
  console.log(`Using AUTH0_MGMT_TOKEN against ${domain}.`);

  async function mgmt(method, urlPath, body, contentType = "application/json") {
    const res = await fetch(`https://${domain}/api/v2/${urlPath}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": contentType,
      },
      body:
        contentType === "application/json" && body !== undefined
          ? JSON.stringify(body)
          : body,
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`${method} ${urlPath} → ${res.status} ${res.statusText}: ${text}`);
    }
    return text ? JSON.parse(text) : {};
  }

  console.log("Saving rollback snapshot...");
  saveRollback("branding", await mgmt("GET", "branding"));
  if (applyTenantSettings) {
    saveRollback("tenant-settings", await mgmt("GET", "tenants/settings"));
  }
  try {
    saveRollback("custom-domains", await mgmt("GET", "custom-domains"));
  } catch (e) {
    console.log(`  (custom-domains read failed, non-fatal: ${e.message})`);
  }

  const brandingBody = loadJson(BRANDING_FILE);
  if (dryRun) {
    console.log("--dry-run: would PATCH branding with:", JSON.stringify(brandingBody, null, 2));
  } else {
    await mgmt("PATCH", "branding", brandingBody);
    console.log("PATCHed branding.");
  }

  if (applyTenantSettings) {
    const tenantBody = loadJson(TENANT_SETTINGS_FILE);
    if (dryRun) {
      console.log("--dry-run: would PATCH tenants/settings with:", JSON.stringify(tenantBody, null, 2));
    } else {
      await mgmt("PATCH", "tenants/settings", tenantBody);
      console.log("PATCHed tenants/settings.");
    }
  }

  if (applyTemplate) {
    const html = readFileSync(TEMPLATE_FILE, "utf8");
    if (dryRun) {
      console.log(`--dry-run: would PUT branding/templates/universal-login (${html.length} bytes of HTML)`);
    } else {
      await mgmt("PUT", "branding/templates/universal-login", html, "text/html");
      console.log("PUT the Universal Login page template.");
    }
  }
}

// ── Auth path 2: the `auth0` CLI, if it has a live session ──────────────
function cliSessionIsActive() {
  try {
    execFileSync("auth0", ["api", "get", "branding"], { stdio: ["ignore", "pipe", "pipe"] });
    return true;
  } catch (e) {
    const stderr = (e.stderr ?? "").toString();
    if (/session has expired|not currently logged in|log in to re-authorize/i.test(stderr)) {
      return false;
    }
    // Some other failure (network, 5xx) — don't claim "no session" for that;
    // surface it so the caller sees the real error instead of a misleading
    // "run auth0 login" hint.
    throw new Error(`auth0 CLI probe failed unexpectedly: ${stderr || e.message}`);
  }
}

function cliApi(method, urlPath, stdinBody) {
  const out = execFileSync("auth0", ["api", method, urlPath], {
    input: stdinBody,
    stdio: ["pipe", "pipe", "pipe"],
  });
  return out.toString();
}

async function viaCli() {
  console.log("Using the `auth0` CLI (active session detected).");

  console.log("Saving rollback snapshot...");
  saveRollback("branding", JSON.parse(cliApi("get", "branding")));
  if (applyTenantSettings) {
    saveRollback("tenant-settings", JSON.parse(cliApi("get", "tenants/settings")));
  }
  saveRollback("custom-domains", JSON.parse(cliApi("get", "custom-domains")));

  const brandingBody = loadJson(BRANDING_FILE);
  if (dryRun) {
    console.log("--dry-run: would `auth0 api patch branding` with:", JSON.stringify(brandingBody, null, 2));
  } else {
    cliApi("patch", "branding", JSON.stringify(brandingBody));
    console.log("PATCHed branding via CLI.");
  }

  if (applyTenantSettings) {
    const tenantBody = loadJson(TENANT_SETTINGS_FILE);
    if (dryRun) {
      console.log("--dry-run: would `auth0 api patch tenants/settings` with:", JSON.stringify(tenantBody, null, 2));
    } else {
      cliApi("patch", "tenants/settings", JSON.stringify(tenantBody));
      console.log("PATCHed tenants/settings via CLI.");
    }
  }

  if (applyTemplate) {
    const html = readFileSync(TEMPLATE_FILE, "utf8");
    if (dryRun) {
      console.log(`--dry-run: would \`auth0 api put branding/templates/universal-login\` with ${html.length} bytes of HTML`);
    } else {
      try {
        cliApi("put", "branding/templates/universal-login", html);
        console.log("PUT the Universal Login page template via CLI.");
      } catch (e) {
        console.error(
          "Page template PUT failed — expected until the custom domain " +
            "(login.openlingoapp.com) is verified; see docs/auth-branding-2026-09-17.md.\n" +
            (e.stderr ? e.stderr.toString() : e.message),
        );
      }
    }
  }
}

// ── Auth path 3: nothing available ───────────────────────────────────────
function printDashboardSteps() {
  const branding = loadJson(BRANDING_FILE);
  const tenant = existsSync(TENANT_SETTINGS_FILE) ? loadJson(TENANT_SETTINGS_FILE) : null;
  console.log(`
No Auth0 credentials available: AUTH0_MGMT_TOKEN is unset and the \`auth0\`
CLI has no active session (run \`auth0 login\`). Nothing was changed.

Apply by hand instead, in this order:

  1. Custom domain (Spencer — needs a card on file):
     Auth0 Dashboard → Branding → Custom Domains → Add Domain →
     "login.openlingoapp.com". Auth0 returns a CNAME target; the lead adds
     that as a Route 53 record for login.openlingoapp.com. Wait for Auth0 to
     show the domain as Verified (can take a few hours for DNS + cert).
     The page template (step 4) ONLY takes effect once this is done — the
     colors/logo below work on the default *.us.auth0.com domain today.

  2. Branding → Universal Login → Colors:
     - Primary: ${branding.colors.primary}
     - Page background: ${branding.colors.page_background}

  3. Branding → Universal Login → General:
     - Logo URL: ${branding.logo_url}
     - Favicon URL: ${branding.favicon_url ?? "(none set)"}
     - Custom font: not exposed in the dashboard — Advanced Options → Custom
       Font in some tenants, otherwise apply via this script/the Management
       API: ${branding.font?.url ?? "(none set)"}
${tenant ? `
  4. Tenant Settings → General:
     - Friendly name: ${tenant.friendly_name}
     - Logo: ${tenant.picture_url}
` : ""}
  5. Once the custom domain is verified, Branding → Universal Login →
     Advanced Options → Page Template (or re-run this script with
     --template once you have a token/CLI session) → paste
     scripts/auth0/page-template.html.

  6. Point the app at the new domain: set VITE_AUTH0_DOMAIN to
     "login.openlingoapp.com" in .env.production and the Amplify build env,
     AND add the same value to the Auth0 application's Allowed Callback
     URLs / Allowed Logout URLs / Allowed Web Origins / Allowed Origins
     (CORS) — they currently list the *.us.auth0.com domain, which will
     stop matching once the app requests the new one.
`);
}

// ── Entry point ───────────────────────────────────────────────────────────
const domain = process.env.AUTH0_DOMAIN;
const token = process.env.AUTH0_MGMT_TOKEN;

if (domain && token) {
  await viaManagementToken(domain, token);
} else {
  let active = false;
  try {
    active = cliSessionIsActive();
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
  if (active) {
    await viaCli();
  } else {
    printDashboardSteps();
  }
}
