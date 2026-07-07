# Content design

Design philosophy for course content, community content, and language handling.

---

## Core principles

### Course content: language-agnostic

- Course structure (modules, lessons, order) is **language-agnostic**.
- Course content is **versioned** and can have **multiple instruction-language variants** (en, ko, ja, etc.).
- A shared **manifest** determines which version to serve per instruction language.
- When an update to a course module is available in the user's chosen instruction language, the manifest points to the new version and that language loads it.
- Gradual translations: new versions can ship with one instruction language first, others added over time.

### Community content: language-specific, no cutover

- Community addons (packs, courses, stories) are **language-specific**.
- Each addon targets one learning language, chosen by the creator at creation time.
- Creator chooses the language; no manifest or multi-language variants.
- **No cutover on language switch.** If a user adds a Korean community course and later switches their learning language to Japanese, the Korean addon stays as-is — it is never migrated, translated, or deleted. It remains in the user's library in its original language.
- When the user's active learning language differs from an addon's language, the addon may be hidden from the default view but is always accessible in the full library.

---

## Language switching

- We **do not guard against** users changing interface or instruction language.
- When switching to a language where community content is unavailable or unsupported, show a **warning**:
  - e.g. "Community content is not supported in this language" or "Some community content may be unavailable."
- **Core courses:** The manifest serves the best available instruction-language variant. Progress is tied to course/lesson IDs and persists across language switches.
- **Community content:** No cutover. Each addon stays permanently associated with its original language. Progress persists by content ID. Switching learning language hides addons for other languages from the default view, but they remain in the user's library and can be accessed at any time.

---

## Instruction language vs interface language

- **Interface language** (UI locale): menus, buttons, labels. From `settings.uiLocale` or similar.
- **Instruction language**: language of course explanations, lesson content. Can be a separate setting.
- These can differ (e.g. UI in English, instruction in Korean for a Korean course).
- Progress is **never** keyed by language—only by content IDs (course, module, lesson, deck, card).

---

## Video content

- **Course-linked videos:** Unlock based on lesson/module completion. Same language-agnostic, versioned model as other course content.
- **Community video addons:** Language-specific (e.g. K-drama pack for Korean). No cutover on language switch — video addons stay in the user's library. Creators can submit video packs (drama clips, music video segments).

Note: video is a standalone **Practice** feature (`/:lang/practice/videos`), *not* a lesson step type (there is no `video` step in `src/features/lesson/types.ts`).

---

## Versioning (course content)

- Manifest shape (conceptual):
  ```json
  {
    "courseId": "ko-beginners",
    "versions": {
      "1.1": { "instructionLangs": ["en", "ko"] },
      "1.0": { "instructionLangs": ["ja"] }
    }
  }
  ```
- User with instruction lang `en` → serve v1.1.
- User with `ja` → serve v1.0 (only version with JA).
- "Update available" when a newer version adds the user's instruction language.
