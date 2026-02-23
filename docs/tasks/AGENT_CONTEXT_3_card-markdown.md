# Agent Context: Markdown for Card Content

**Copy this entire document** and give it to the AI agent. It contains everything needed to implement the task.

---

## Task

Add **markdown support** for flashcard content (front, back, note, reasoning). Cards currently use plain text. Interpret stored strings as markdown when rendering. Support inline images via `![alt](url)`. Keep backward compatibility with existing cards and the legacy `image` field.

---

## Project context

- **Stack:** Vite + React, Tailwind, react-i18next
- **react-markdown** is already installed and used in `ThreadPage.tsx` and `MarkdownEditor.tsx` for forum posts
- **i18n:** Add keys to `en.json` and `ko.json` if needed
- Card types: `word`, `sentence`, `other` — all have `front`, `back`, `note`, `reasoning`, optional `image`

---

## Current behavior

### CardFace rendering

**FlashcardTester** and **CardPreview** use a `CardFace` component that:
- For `front` with highlight mode + `parts`/`words`: renders `HighlightedText` (segment-by-segment with particle/root highlighting)
- Otherwise: renders `card.front` or `card.back` as plain text: `return <>{card.front}</>` or `return <>{card.back}</>`

**Key logic:** When there are no `parts`/`words` to highlight, it falls back to raw text. That's where we add markdown rendering.

### Card structure (types.ts)

```ts
FlashcardBase: { id, front, back, note?, image?, type, reasoning?, unlocked? }
// front, back, note, reasoning are strings
// image is optional URL (legacy — render separately)
```

### Where card content is rendered

1. **FlashcardTester** — `CardFace` for front/back during review
2. **CardPreview** — `CardFace` + note, reasoning, definition, context (used in DeckEditor preview)
3. **DeckPreviewModal** — card list shows `card.front` and `card.back` in `<p>` tags (lines ~246–256)
4. **DeckEditor** — textareas for front/back/note; CardPreview for live preview

---

## Requirements

### 1. Create a shared MarkdownRenderer

Create `src/shared/components/MarkdownRenderer.tsx` (or in `flashcards` if you prefer feature-local):

- Takes `children: string` and renders via `ReactMarkdown`
- Use `prose` or similar Tailwind for readable output (headings, lists, etc.)
- Restrict to safe/simple styling — card faces are compact
- For images: ensure `![alt](url)` works. `react-markdown` renders `<img>` by default. May need `rehype` plugin to add `loading="lazy"` or constrain size. Verify no XSS — react-markdown escapes by default; URLs in images could be `javascript:` — consider sanitizing or restricting to `https:`.

### 2. Rendering logic

**When to use markdown vs plain:**
- **Recommendation:** Always treat `front`, `back`, `note`, `reasoning` as markdown. Plain text passes through unchanged (no markdown chars = same output).
- **Highlight mode exception:** When `CardFace` shows `HighlightedText` (word/sentence with parts/words), it renders segments. Those segments are plain text. The markdown path is only when we render the raw `front`/`back` string.

**CardFace logic (simplified):**
```
if (front && highlightMode && has parts/words) → HighlightedText  (unchanged)
else → MarkdownRenderer(card.front) or MarkdownRenderer(card.back)
```

For `note`, `reasoning`, `definition`, `context` — always use MarkdownRenderer when rendering.

### 3. Legacy `image` field

- Cards may have `card.image` (URL). Currently shown via `<CardImage src={card.image} />` before/after the text.
- Keep this. If `front`/`back` also contain `![alt](url)`, both render.
- Order: image (if present) then markdown content, or per existing layout.

### 4. DeckEditor — Support Markdown & Previewing

**Preview:** The editor already uses `CardPreview` for the live preview (right pane). When you update CardPreview to render markdown, the editor preview will **automatically** show markdown — no extra work. Ensure DeckEditor keeps using CardPreview for the selected card; do not duplicate rendering logic.

**Editor form updates:**
- **Front, Back:** Keep as textareas (they already support multiline). Add a hint below or beside the label: "Markdown supported: **bold**, *italic*, ![image](url)"
- **Note:** Currently `<input type="text">` — change to `<textarea>` (rows=2 or 3) so users can write markdown (e.g. multiline, lists). **Reasoning** is already a textarea — no change needed.
- **Labels:** Add i18n keys for the markdown hint if needed (e.g. `community.editorMarkdownHint`)

**No toolbar required** for this task. Plain textareas where users type markdown manually. The live preview (CardPreview) shows the rendered result as they type.

### 5. DeckPreviewModal

- Card list items (lines ~246–256) show `card.front` and `card.back` in `<p>` tags.
- Replace with `MarkdownRenderer` or inline ReactMarkdown so markdown displays correctly in the preview list.

---

## Files to create/edit

| File | Action |
|------|--------|
| `src/shared/components/MarkdownRenderer.tsx` | **Create** — shared markdown renderer |
| `src/features/flashcards/FlashcardTester.tsx` | Edit CardFace to use MarkdownRenderer for plain fallback |
| `src/features/flashcards/CardPreview.tsx` | Edit CardFace + note/reasoning/definition/context to use MarkdownRenderer |
| `src/features/flashcards/DeckPreviewModal.tsx` | Edit card list items to render front/back as markdown |
| `src/features/community/contribute/DeckEditor.tsx` | Add "Markdown supported" hint near front/back; change Note from input to textarea (Reasoning is already textarea); preview uses CardPreview — will show markdown once CardPreview is updated |
| `docs/dataformats/flashcards/README.md` | Add note that front/back/note/reasoning support markdown |

**Note:** CardFace is defined in both FlashcardTester and CardPreview (duplicated). Consider extracting to a shared component or a single `CardFace` in CardPreview that FlashcardTester imports. Or keep both and update both.

---

## Implementation approach

1. **Create MarkdownRenderer:**
   ```tsx
   import ReactMarkdown from "react-markdown";
   // Optional: remark-gfm for tables, strikethrough
   // Style: className="prose prose-sm dark:prose-invert max-w-none" or similar
   export function MarkdownRenderer({ children, className }: { children: string; className?: string }) {
     return <ReactMarkdown className={className}>{children}</ReactMarkdown>;
   }
   ```

2. **CardFace fallback:** When not using HighlightedText, replace `return <>{card.front}</>` with `return <MarkdownRenderer>{card.front}</MarkdownRenderer>` (and same for back).

3. **Note, reasoning, etc.:** In CardPreview, replace `<p>{card.note}</p>` with `<MarkdownRenderer>{card.note}</MarkdownRenderer>` (and similarly for reasoning, definition, context).

4. **DeckPreviewModal:** In the card list `<li>`, replace the inner `<p>` with MarkdownRenderer for front and back.

5. **DeckEditor:** (a) Add markdown hint near front/back labels. (b) Change Note from `<input>` to `<textarea>` (rows=2 or 3) for multiline markdown. (c) Reasoning is already textarea. (d) Preview already uses CardPreview — once CardPreview renders markdown, editor preview works automatically. Do not add a separate preview; reuse CardPreview.

6. **Empty/short content:** MarkdownRenderer should handle empty string. ReactMarkdown with empty string typically renders nothing. Verify.

7. **Image sizing:** Markdown images may be large. Consider adding `img { max-width: 100%; height: auto; }` via Tailwind or a custom component for `img` in react-markdown (use `components={{ img: ... }}`).

---

## Acceptance criteria

- [ ] Card front/back render as markdown in FlashcardTester and CardPreview
- [ ] Card note and reasoning render as markdown in CardPreview
- [ ] Images via `![alt](url)` in card content display correctly
- [ ] DeckPreviewModal card list shows markdown for front/back
- [ ] **DeckEditor:** Markdown hint visible; Note (and Reasoning if applicable) are textareas; live preview uses CardPreview and shows markdown as user types
- [ ] Existing cards without markdown render correctly (plain text = same as before)
- [ ] Legacy `card.image` field still works (rendered separately)
- [ ] `npm run build` passes

---

## Conventions

- Use Tailwind for styling
- Follow existing patterns (see ThreadPage for ReactMarkdown usage)
- No schema change to card types — `front`, `back`, `note`, `reasoning` stay as strings
- Optional: add `remark-gfm` for GFM (tables, strikethrough) — check if already a dep

---

## Dependencies

- `react-markdown` — already in package.json
- `remark-gfm` — optional, for GitHub Flavored Markdown. Add if desired: `npm install remark-gfm`
