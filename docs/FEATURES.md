# Feature ideas & backlog

From the plan; not all implemented. Omit obvious done items.

---

## Learning & content

- **SRS / Anki-style review (course deck unlock by lesson completion; see FLASHCARD-DATA.md)** — Spaced repetition for flashcards; “cards due today” and review sessions.
- **Stories** — Read and learn in context; story-based lessons with comprehension.
- **Grammar heatmap** — Visualize coverage/strength by topic; link from home.
- **Vocab lists** — Themed lists; course vocab from module manifests (see FLASHCARD-DATA.md).
- **Course content** — Language-agnostic, versioned, manifest-driven (see CONTENT-DESIGN.md).
- **Community content** — Language-specific; warn when unsupported on language switch (see CONTENT-DESIGN.md).
- **Language-specific practice** — Particles, kanji, alphabets, character components; routes and config exist; content and drills to fill in.
- **Videos** — K-drama, J-drama, music video clips as a practice type. Unlock by course progress; community video addons; video steps embedded in lessons (see practice-hub.md, lessons format).

---

## Progress & sync

- **Real progress API** — Streak, lessons this week, cards due, daily goal; persist and sync.
- **Cross-device settings** — User API (or Auth0 user_metadata via backend) so language/theme/prefs follow the user.
- **Offline / sync layer** — Optional IStorage/ISync for offline progress and sync when backend exists.

---

## Social & community

- **Leaderboard** — Real XP and rankings; period (week/month); shareable link.
- **Community** — Discussions or Discord when community grows; contribute flow (courses, feedback, code).
- **Contributor flow** — Clear path to submit courses, suggest content, report issues (GitHub, forms, or backend).

---

## Product & sustainability

- **Funding meter** — Real ad-funded vs premium split; transparency and sustainability messaging.
- **Premium / subscriptions** — If planned; tie to auth and feature gating.

---

## UX & polish

- **More UI languages** — e.g. Spanish; add locale and use in Settings.
- **React Native** — Web-first; RN later if in scope; shared logic where possible.
