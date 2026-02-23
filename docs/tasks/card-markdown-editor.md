# Task: Markdown for Card Content

**Files:** `src/features/flashcards/data/types.ts`, `src/features/community/contribute/DeckEditor.tsx`, `CardPreview.tsx`, `FlashcardTester.tsx`, deck API schemas
**Current state:** Cards use `front`, `back`, `note`, `reasoning` as plain text. `image` is a separate URL field. DeckEditor uses plain textareas.

## Goal

Support **markdown** for card content (front, back, note, reasoning). Default to plain text for simplicity; add option to use a **rich markdown editor** when creating/editing cards. Store images inline via markdown (e.g. `![alt](url)`) instead of separate `image` IDs/fields.

## Benefits

- No need to store image IDs separately — images live in markdown
- Bold, italic, lists, code blocks for language content
- Richer card presentation
- Single source of truth: markdown string

## Requirements

### Storage
- Keep `front`, `back`, `note`, `reasoning` as strings
- **Interpret as markdown** when rendering
- For backward compatibility: if content has no markdown, render as plain text (or always run through markdown renderer — blank/plain stays plain)
- Optional: add `contentFormat?: "plain" | "markdown"` to card type for explicit opt-in (default `"plain"` for existing cards)

### Rendering
- Use `react-markdown` (or similar) to render card faces in:
  - FlashcardTester
  - CardPreview
  - DeckPreviewModal card list
  - DeckEditor preview
- Sanitize for XSS (react-markdown typically escapes; verify)
- Support `![alt](url)` for images — no separate `image` field needed for new cards
- Keep `image` field for backward compatibility (legacy cards); render before/after markdown content if present

### Editor
- **Default:** Plain textarea (current behavior) — users can type markdown manually
- **Optional rich editor:** Toggle or mode to switch to a markdown editor with:
  - Toolbar (bold, italic, list, link, image)
  - Preview tab or inline preview
  - Image paste/upload → insert `![alt](url)` 
- See `COMMUNITY_PLANNING.md` § Rich Markdown Editor for toolbar API ideas

### Data format
- No schema change required if we treat all strings as markdown
- Or: add `contentFormat` to card type; default `"plain"` = render as pre-wrapped text (no markdown); `"markdown"` = parse and render
- Recommendation: **always treat as markdown** — plain text renders fine through markdown (no special chars = same output)

## Acceptance criteria

- [ ] Card front/back/note/reasoning render as markdown in FlashcardTester and CardPreview
- [ ] Images in markdown `![alt](url)` display correctly
- [ ] DeckEditor: optional rich markdown editor (toolbar, preview) or at least document that markdown is supported
- [ ] Backward compatibility: existing cards without markdown render correctly
- [ ] `image` field still supported for legacy cards
- [ ] `npm run build` passes

## Files

- `src/features/flashcards/data/types.ts` (optional `contentFormat`)
- `src/features/flashcards/FlashcardTester.tsx` — render CardFace with markdown
- `src/features/flashcards/CardPreview.tsx` — render with markdown
- `src/features/flashcards/DeckPreviewModal.tsx` — card list preview
- `src/features/community/contribute/DeckEditor.tsx` — textarea or rich editor
- `src/shared/components/` — optional `MarkdownRenderer.tsx` (shared)
- `docs/dataformats/flashcards/README.md` — document markdown support

## Dependencies

- `react-markdown` (check if already in project)
- Optional: `remark-gfm` for tables, strikethrough
- Optional: image upload → URL for `![](url)` (could be separate task)
