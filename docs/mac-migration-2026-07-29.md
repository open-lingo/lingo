# WSL → MacBook migration checklist

Audit run 2026-07-29 on the WSL box. Everything below is either "already in
git" (safe), "not in git" (must be carried), or "regenerable" (don't bother).

Transfer payload excluding chat transcripts is **~31 MB**. With transcripts it
is **~1.25 GB**.

---

## 0. The one thing that silently breaks

Claude Code keys per-project state by **working directory**, with `/` → `-`:

```
cwd /mnt/c/Users/Spencer  →  ~/.claude/projects/-mnt-c-Users-Spencer/
```

Your 25 memory files and `MEMORY.md` live under that key. On the Mac the cwd
changes, so a straight copy of `~/.claude` leaves the memories under a key that
no longer matches and **they will not load** — silently, with no error.

Pick the Mac working directory first, then place the memory dir under the key
that directory produces. E.g. if you work from `/Users/spencer/projects/lingle`:

```
~/.claude/projects/-Users-spencer-projects-lingle/memory/
```

Same rename applies to the transcripts if you carry them.

---

## 1. Already safe — just clone

| Repo | State |
| --- | --- |
| `lingle/lingo` | pushed to `origin/main` @ `091ab3d1` |
| `lingle/lingo-core` | in sync, clean |
| `itaiko-firmware` | clean, branch `companion-telemetry` |
| `taiko-dojo` | clean |
| `roblox-game-design-master-docs` | clean |

`CLAUDE.md`, `docs/INDEX.md`, and `docs/backlog/items.yaml` are all tracked —
the backlog comes across with the clone.

## 2. Unpushed work — push BEFORE wiping the box

| Repo | Risk |
| --- | --- |
| `hol-game` | **9 unpushed commits** + 11 dirty files (has remote) |
| `ui-design-master-docs` | 43 dirty on branch `pizza-gacha-redesign` (has remote) |
| `td-game` | 2 dirty (has remote) |
| `macro` | **NO REMOTE.** 12 commits + 15 dirty. The whole repo is local-only — it dies with the box unless copied or given a remote. |
| `project-test` | no commits at all, untracked scratch — probably disposable |

## 3. Not in git — must be carried

| Path | Size | Why it matters |
| --- | --- | --- |
| `lingo/research/` | 30 MB | Scraped study material — cure-dolly transcripts (2.3M), duolingo teardown + course tree (14M), qa (12M), anki, jouzu-juls. Gitignored deliberately ("internal study only, not shipped"). Re-scraping is slow and may not reproduce. |
| `lingo/docs/research/` | 80 KB | 6 research docs incl. the duolingo deep survey and gap analysis |
| `lingo/.env` | 218 B | `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID`, `VITE_AUTH0_AUDIENCE`, `VITE_API_BASE_URL` |
| `lingo-core/.env` | 485 B | `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `DB_BACKEND`, `SQLITE_PATH`, `CORS_ORIGINS`, `DEBUG`, `DEV_USER` |
| `~/.claude/projects/<key>/memory/` | small | 25 memories + `MEMORY.md` — see §0 |
| `~/.claude/settings.json` | 1.5 KB | permissions, hooks, plugins, effort level |
| `~/.claude/scripts/lingle-index-delta.sh` | small | SessionStart index-freshness hook |
| `~/.claude/lingle-index/` | small | hook state (`last-check`, `last-index-update`) |
| `Documents/Career/` (Windows) | 184 KB | dossier, v6+v7 resumes, LinkedIn kit, action plan |
| `~/.claude/projects/` | 1.2 GB | chat transcripts. **Optional** — but the `thread-index` memory is a catalog of grep recipes *into these files*. Without them that memory is a map to nothing. |

Neither `.env` holds a private key — Auth0 public config and local dev flags
only. Both are near-identical to their committed `.env.example`.

## 4. Regenerable — do NOT copy

- `node_modules/` → `npm ci`
- `lingo/src/pub/dict/` (18 MB) → the vite `copy-kuromoji-dict` plugin mirrors
  it from `node_modules/kuromoji/dict` on startup (`vite.config.ts:280`)
- `lingo/artifacts/` (44 MB visual-QA screenshots) → `npm run visual-qa:capture`
- `lingo/.auth/user.json` → `npm run auth:capture`
- `lingo/dist`, `test-results`, `playwright-report`, `tsconfig.tsbuildinfo`
- `lingo-core/.venv`, `.venv-tts`, `__pycache__`, `.pytest_cache`, `.ruff_cache`
  → rebuild from `pyproject.toml`

## 5. Mac-side fixes after the copy

1. **Rewrite the hook paths.** `~/.claude/scripts/lingle-index-delta.sh` hard-codes
   `/home/beast/.claude/...`, `/home/beast/projects/lingle/{lingo,core}`,
   `/mnt/c/Users/Spencer`, and the transcript dirs. All five must change or the
   SessionStart hook fails quietly.
2. **`settings.json`** — `Bash(powershell.exe *)` is WSL-only (harmless, can
   drop). The `PostToolUse` hook calls `$HOME/.local/bin/gallery-push`, which is
   a local script not in any repo — carry it or drop the hook.
3. **Roblox Studio MCP** — configured globally and for `td-game`; needs
   reinstalling against Mac Roblox Studio. Unrelated to lingle.
4. **Node** — box was on v20.13.1 / npm 10.5.2. No `engines` field in
   `package.json`, so any Node 20+ is fine.
5. **Line endings / permissions** — the WSL copies sit on an NTFS mount and show
   as `0777`. Expect a large spurious mode-change diff if you copy the working
   tree instead of cloning fresh. **Clone fresh; copy only the ignored dirs.**

## 6. Suggested order

```
# on WSL, before anything
cd ~/projects/hol-game            && git add -A && git commit && git push
cd ~/projects/ui-design-master-docs && git add -A && git commit && git push
cd ~/projects/td-game             && git add -A && git commit && git push
# macro has no remote — create one, or copy the directory wholesale

# carry (ethernet/rsync or iCloud)
lingo/research/  lingo/docs/research/  lingo/.env  lingo-core/.env
~/.claude/projects/<key>/memory/  ~/.claude/settings.json
~/.claude/scripts/  ~/.claude/lingle-index/
Documents/Career/
[optional] ~/.claude/projects/   # 1.2 GB of transcripts

# on Mac
git clone git@github.com:open-lingo/lingo.git
git clone git@github.com:open-lingo/lingo-core.git
npm ci                            # dict auto-mirrors on first vite run
# drop the .env files in, rename the memory key, fix the hook paths
npm run dev                       # port 5173, strict
```
