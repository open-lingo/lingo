# WSL → MacBook migration checklist (lingle only)

Audit run 2026-07-29 on the WSL box, scoped to lingle. Other repos under
`~/projects` were deliberately left out of scope.

Transfer payload: **~31 MB** of working files + **781 MB** of chat transcripts.

---

## 0. The one thing that silently breaks

Claude Code keys per-project state by **working directory**, with `/` → `-`:

```
cwd /mnt/c/Users/Spencer  →  ~/.claude/projects/-mnt-c-Users-Spencer/
```

Your 25 memory files and `MEMORY.md` live under that key. On the Mac the cwd
changes, so a straight copy of `~/.claude` leaves the memories under a key that
matches no directory you work from — and **they will not load**, silently, with
no error.

Pick the Mac working directory first, then place the `memory/` folder under the
key that directory produces. E.g. working from `/Users/spencer/projects/lingle`:

```
~/.claude/projects/-Users-spencer-projects-lingle/memory/
```

**This applies only to `memory/`.** The transcript archives do *not* need
key-matched names — see §3.

---

## 1. Already safe — just clone

| Repo | State |
| --- | --- |
| `lingle/lingo` | pushed to `origin/main` @ `245197b8` |
| `lingle/lingo-core` | in sync, clean |

`CLAUDE.md`, `docs/INDEX.md`, and `docs/backlog/items.yaml` are all tracked, so
the whole backlog comes across with the clone. Nothing is left unpushed.

## 2. Not in git — must be carried (~31 MB)

| Path | Size | Why it matters |
| --- | --- | --- |
| `lingo/research/` | 30 MB | Scraped study material — cure-dolly transcripts (2.3M), duolingo teardown + course tree (14M), qa (12M), anki, jouzu-juls. Gitignored on purpose ("internal study only, not shipped"). Slow to re-scrape and may not reproduce. |
| `lingo/docs/research/` | 80 KB | 6 research docs incl. the duolingo deep survey and gap analysis |
| `lingo/.env` | 218 B | `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID`, `VITE_AUTH0_AUDIENCE`, `VITE_API_BASE_URL` |
| `lingo-core/.env` | 485 B | `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `DB_BACKEND`, `SQLITE_PATH`, `CORS_ORIGINS`, `DEBUG`, `DEV_USER` |
| `~/.claude/projects/-mnt-c-Users-Spencer/memory/` | small | 25 memories + `MEMORY.md` — see §0 |
| `~/.claude/settings.json` | 1.5 KB | permissions, hooks, plugins, effort level |
| `~/.claude/scripts/lingle-index-delta.sh` | small | SessionStart index-freshness hook |
| `~/.claude/lingle-index/` | small | hook state (`last-check`, `last-index-update`) |
| `Documents/Career/` (Windows) | 184 KB | dossier, v6+v7 resumes, LinkedIn kit, action plan |

Neither `.env` holds a private key — Auth0 public config and local dev flags
only. Both are near-identical to their committed `.env.example`.

## 3. Chat transcripts (781 MB) — worth carrying

The `thread-index` memory is a catalog of grep recipes pointing *into* these
files. Without them it is a map to nothing.

| Archive | Size | Coverage |
| --- | --- | --- |
| `~/.claude/projects/-mnt-c-Users-Spencer/` | 674 MB | July 2026 → now |
| `~/.claude/projects/-home-beast-projects-lingle/` | 107 MB | pre-2026-07-07 |

2,390 `.jsonl` files total across the box; these two dirs are the lingle ones.
Only top-level `*.jsonl` are sessions — subdirectories are subagent dumps and
`thread-index` says never to mine them.

**These are read by explicit path, not by project key**, so they can live
anywhere. Recommended: park them outside the live projects dir —

```
~/claude-archive/wsl-A/   ← from -mnt-c-Users-Spencer
~/claude-archive/wsl-B/   ← from -home-beast-projects-lingle
```

— which keeps 781 MB of dead sessions out of your `--resume` picker. The
tradeoff is that those old sessions become grep-only, no longer resumable.
If resuming them matters more, drop them under the new project key instead.

Not carried: `-home-beast-projects-stocks-maybe/` (353 MB) is the only other
large archive on the box. Out of scope here — say if you want it.

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

Three files hard-code WSL paths and must be edited, or things fail quietly:

1. **`memory/thread-index.md` line 11** — names both transcript dirs as
   `A=/home/beast/.claude/projects/-mnt-c-Users-Spencer` and
   `B=/home/beast/.claude/projects/-home-beast-projects-lingle`, plus the hook
   path. Repoint at wherever §3 put them.
2. **`memory/lingle-dev-recipe.md` line 10** — says the repos live at
   `/home/beast/projects/lingle/{lingo,lingo-core}`.
3. **`~/.claude/scripts/lingle-index-delta.sh`** — hard-codes five paths:
   `STATE_DIR`, `LINGO`, `CORE`, `THREAD_INDEX`, and both transcript dirs. It
   also gates on a cwd prefix match (`/mnt/c/Users/Spencer*|/home/beast/projects/lingle*`)
   that will never fire on the Mac.

Then:

4. **`settings.json`** — `Bash(powershell.exe *)` is WSL-only (harmless, can
   drop). The `PostToolUse` hook calls `$HOME/.local/bin/gallery-push`, a local
   script in no repo — carry it or drop that hook. The Roblox Studio MCP entry
   is unrelated to lingle.
5. **Node** — box was on v20.13.1 / npm 10.5.2. No `engines` field in
   `package.json`, so any Node 20+ works.
6. **Clone fresh; copy only the ignored dirs.** The WSL working tree sits on an
   NTFS mount and shows as `0777` — copying it wholesale produces a large
   spurious mode-change diff.

## 6. Order

```
# carry (ethernet/rsync, or iCloud for the ~31 MB part)
lingo/research/  lingo/docs/research/  lingo/.env  lingo-core/.env
~/.claude/projects/-mnt-c-Users-Spencer/memory/
~/.claude/settings.json  ~/.claude/scripts/  ~/.claude/lingle-index/
Documents/Career/
~/.claude/projects/-mnt-c-Users-Spencer/*.jsonl        → archive A
~/.claude/projects/-home-beast-projects-lingle/*.jsonl → archive B

# on Mac
git clone git@github.com:open-lingo/lingo.git
git clone git@github.com:open-lingo/lingo-core.git
npm ci                    # dict auto-mirrors on first vite run
# drop the .env files in, rename the memory key (§0), fix the 3 path files (§5)
npm run dev               # port 5173, strict
```
