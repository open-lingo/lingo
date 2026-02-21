# Community & Forum – Planning Document

## 1. Database Schema

### Overview

Threads need to link to both **official content** (courses, lessons, modules) and **community content** (addons, flashcard packs, courses, stories). Use a polymorphic link table so one thread can reference any content type.

---

### Core Tables

#### `users`
- `id`, `email`, `name`, `avatar_url`, `created_at`, `updated_at`
- (Auth handled by Auth0; we may only store minimal profile sync)

#### `forum_categories`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| slug | text | unique, e.g. `general`, `features` |
| name_key | text | i18n key |
| description_key | text | i18n key |
| sort_order | int | display order |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `forum_tags`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| slug | text | unique |
| name | text | display name |
| color | text | optional, e.g. `blue`, `green` |
| created_at | timestamptz | |

#### `forum_threads`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| category_id | uuid | FK → forum_categories |
| author_id | uuid | FK → users |
| title | text | |
| excerpt | text | short summary, or derived from body |
| body_markdown | text | main content |
| reply_count | int | denormalized, updated via trigger/cron |
| upvote_count | int | denormalized |
| downvote_count | int | denormalized |
| view_count | int | denormalized |
| is_pinned | bool | default false |
| status | enum | `open`, `solved`, `closed` (or derive "hot" from activity) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `forum_thread_tags`
| Column | Type | Notes |
|--------|------|-------|
| thread_id | uuid | FK → forum_threads |
| tag_id | uuid | FK → forum_tags |
| PRIMARY KEY (thread_id, tag_id) | | |

---

### Content Linking – Polymorphic Links

A thread can be *about* or *related to* specific content. Use a generic link table.

#### `forum_content_links`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| thread_id | uuid | FK → forum_threads |
| content_type | enum | `official_course`, `official_lesson`, `official_module`, `addon`, `flashcard_pack`, `video`, `video_pack` |
| content_id | text | ID in the source system (e.g. `official-ko`, `addon-1`, `m1-l1`) |
| optional: language_id | text | e.g. `ko`, `ja` – helps filtering |
| created_at | timestamptz | |

**`content_type` + `content_id`** uniquely identifies the linked content.

**Examples:**
- Thread "Bug in Greetings lesson" → `content_type: official_lesson`, `content_id: m1-l1`, `language_id: ko`
- Thread "Review: Korean Particles pack" → `content_type: flashcard_pack`, `content_id: addon-1`
- Thread "K-Drama course suggestions" → `content_type: addon`, `content_id: addon-3`

**Official content IDs** (from your app):
- `official_course`: `official-ko`, `official-ja`, etc.
- `official_lesson`: `m1-l1`, `m2-l2`, etc.
- `official_module`: `m1`, `m2`, etc.

**Community content IDs**:
- `addon` / `flashcard_pack` / `story` / `grammar`: IDs from `community_addons` table

---

### Community Content Tables (for addons)

#### `community_addons`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| kind | enum | `course`, `flashcard_pack`, `story`, `grammar`, `video`, `video_pack` |
| language_id | text | |
| name | text | |
| description | text | |
| source_url | text | GitHub or external repo |
| author_id | uuid | FK → users |
| upvote_count | int | denormalized (see Community ratings below) |
| item_count | int | cards, lessons, etc. |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| status | enum | `draft`, `published`, `archived` |

#### `community_addon_maintainers`
| Column | Type | Notes |
|--------|------|-------|
| addon_id | uuid | FK → community_addons |
| user_id | uuid | FK → users |
| PRIMARY KEY (addon_id, user_id) | | |

---

### Forum Posts & Votes

#### `forum_posts`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| thread_id | uuid | FK → forum_threads |
| parent_id | uuid | nullable, FK → forum_posts (for replies) |
| author_id | uuid | FK → users |
| body_markdown | text | |
| upvote_count | int | denormalized |
| downvote_count | int | denormalized |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `forum_votes` (for threads and posts)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → users |
| target_type | enum | `thread`, `post` |
| target_id | uuid | thread_id or post_id |
| value | int | `1` (up) or `-1` (down) |
| created_at | timestamptz | |
| UNIQUE (user_id, target_type, target_id) | | one vote per user per target |

---

### Community Content Ratings (Decks, Addons)

**Design decision:** Keep votes in a separate table; denormalize counts into manifests for fast reads.

#### `content_votes`
| Column | Type | Notes |
|--------|------|-------|
| user_id | uuid | FK → users |
| target_type | enum | `deck`, `addon`, `story` |
| target_id | text | deck id, addon id, etc. |
| vote | int | `1` (up) or `-1` (down) |
| created_at | timestamptz | |
| UNIQUE (user_id, target_type, target_id) | | one vote per user per item |

**Denormalization:** `community_addons.upvote_count` and `deck_manifests.upvote_count` (if applicable) are updated in the same transaction when a vote is cast or changed.

**API:**
- `POST /api/content/:type/:id/vote` — body: `{ vote: 1 | -1 }`
- `DELETE /api/content/:type/:id/vote` — remove vote

**TODO:** Implement when backend is ready. See [community-deck-preview](tasks/community-deck-preview.md).

---

### Indexes

- `forum_threads(category_id)`, `forum_threads(created_at)`, `forum_threads(updated_at)`
- `forum_content_links(thread_id)`, `forum_content_links(content_type, content_id)` – for "threads about this course/addon"
- `forum_posts(thread_id)`, `forum_posts(parent_id)`
- `forum_votes(target_type, target_id)`

---

### API Shape (for frontend)

- `GET /api/forum/threads?category=&tag=&content_type=&content_id=` – filter by linked content
- `GET /api/forum/content/:type/:id/threads` – threads linked to a specific course/addon
- `POST /api/forum/threads` – create thread, optionally with `content_links: [{ content_type, content_id }]`
- `PATCH /api/forum/threads/:id` – update, including content links

---

## 2. Rich Markdown Editor

### Goals

- Toolbar with buttons for common formatting (headers, bold, italic, lists, links, code)
- Insert markdown at cursor (or around selection)
- Keep Write / Preview tabs
- Mobile-friendly (compact toolbar)
- Accessible (keyboard, screen readers)

---

### Toolbar Actions

| Button | Icon / Label | Action |
|--------|--------------|--------|
| H1 | H1 | Insert `# ` at line start |
| H2 | H2 | Insert `## ` |
| H3 | H3 | Insert `### ` |
| Bold | **B** | Wrap selection with `**` |
| Italic | *I* | Wrap selection with `*` |
| Strikethrough | ~~S~~ | Wrap with `~~` |
| Code | `</>` | Wrap with `` ` `` or ` ``` ` for block |
| Link | 🔗 | Insert `[text](url)` |
| Bullet list | • | Insert `- ` at line start |
| Numbered list | 1. | Insert `1. ` |
| Blockquote | " | Insert `> ` |
| Horizontal rule | — | Insert `\n---\n` |
| (Optional) Image | 🖼 | Insert `![alt](url)` |

---

### Implementation Approaches

#### Option A: Custom toolbar + textarea
- Use `useRef` on textarea, `setSelectionRange` / `selectionStart` / `selectionEnd`
- On button click: `document.execCommand` or manual string manipulation (insert at cursor)
- **Pros**: Lightweight, no extra deps, full control  
- **Cons**: Careful handling of cursor position, multi-line selection

#### Option B: ContentEditable + custom logic
- `contentEditable` div, intercept input, maintain markdown source
- **Pros**: Rich in-place editing  
- **Cons**: Complex to keep markdown and DOM in sync

#### Option C: Library – e.g. `@uiw/react-md-editor`
- Full-featured markdown editor with toolbar
- **Pros**: Battle-tested, many shortcuts, often supports preview  
- **Cons**: Extra dependency, bundle size, possible styling overrides

#### Option D: Lightweight toolbar + textarea (recommended)
- Toolbar component that:
  1. Gets `ref` to textarea
  2. On button click: read `selectionStart`, `selectionEnd`, `value`
  3. Apply transformation (wrap, insert line prefix, etc.)
  4. Update `value` and restore cursor
- **Pros**: Small, predictable, works with existing `value` / `onChange`  
- **Cons**: Manual implementation of each action

---

### Toolbar API (proposed)

```ts
// RichMarkdownEditor.tsx
interface ToolbarAction {
  icon: ReactNode;      // or icon key
  label: string;        // for a11y
  transform: (value: string, selection: { start: number; end: number }) => {
    newValue: string;
    newCursorStart: number;
    newCursorEnd: number;
  };
}
```

**Transform examples:**
- **Bold**: wrap selection with `**`; if no selection, insert `****` and place cursor in the middle
- **H2**: if cursor at start of line, insert `## `; else insert `\n## ` before current line
- **Link**: insert `[selection](url)` or `[link text](url)`; prompt for URL if needed

---

### File Structure

```
src/features/community/forum/
  MarkdownEditor.tsx       → rename to RichMarkdownEditor.tsx
  Toolbar.tsx              → new: format buttons
  useTextareaSelection.ts  → hook: selection, insertText, wrapSelection
```

---

### Accessibility

- Toolbar buttons: `aria-label` for each action
- Keyboard shortcuts (optional): e.g. Ctrl+B for bold, Ctrl+H for header
- Ensure focus returns to textarea after toolbar action
- Preview: same as today with `react-markdown`

---

## 3. Next Steps

1. **Schema**: Add migrations (e.g. Drizzle, Prisma, raw SQL) for the above tables
2. **API**: Implement CRUD for threads, posts, votes, content links
3. **Frontend**: Add content link selector when creating/editing threads (dropdown: "Link to course/addon")
4. **Editor**: Implement `useTextareaSelection` + `Toolbar` + integrate into `RichMarkdownEditor`
5. **Thread detail**: Display linked content (e.g. "Related: Korean for Beginners → Greetings") with links to that content
