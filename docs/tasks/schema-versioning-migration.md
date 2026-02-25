# Task: Schema Versioning & Migration Layer

**Context:** Eventually we want to get serious about DB schema. For now, this is an **investigation / planning** task—don’t implement yet, but design for it.

**Why it matters:** Several structures will evolve and can break clients if not versioned:
- Lesson JSON format
- Theme schema
- Settings structure
- Sync payload structure

Without schema versioning, you risk:
- Old mobile apps crashing on new data
- CDN content breaking web clients
- Silent corruption when formats change

## Goals

1. **Investigate** current schemas and where `schemaVersion` should live
2. **Design** a versioning strategy (v1 viewers, v2 viewers, migration pipeline)
3. **Plan** migration functions for each schema domain
4. **Document** conventions so future changes are safe

## Design principles

- Every content/schema object includes `schemaVersion: number`
- Migration functions: `migrateLessonV1toV2()`, `migrateThemeV1toV2()`, `migrateSettingsV1toV2()`, etc.
- Viewers/readers are version-aware: v1 viewer only reads v1; v2 viewer reads v1 (via migration) or v2
- Migration is additive and explicit—no silent coercion

## Domains to version

| Domain       | Current state        | Migration target                 |
|-------------|----------------------|----------------------------------|
| Lesson JSON | (explore codebase)   | `migrateLessonV1toV2()`          |
| Theme schema| `theme/types.ts`     | `migrateThemeV1toV2()`           |
| Settings    | User/settings shape  | `migrateSettingsV1toV2()`        |
| Sync payload| SRS sync, progress   | `migrateSyncPayloadV1toV2()`     |

## Deliverables (investigation phase)

- [ ] Audit: list all JSON/schema shapes that cross client/server or CDN
- [ ] Propose: where to add `schemaVersion` and what “v1” means for each
- [ ] Design: migration function signatures and error handling
- [ ] Write: `docs/SCHEMA_VERSIONING.md` with conventions and examples

## Out of scope (for now)

- Actual migration implementation
- DB schema changes
- Backward-compatible API versioning (separate concern)

## Files to explore

- `src/shared/theme/types.ts` — theme schema
- `lingo-core/` — API payloads, sync, settings
- `src/features/flashcards/` — lesson/deck JSON structures
- Any CDN-served JSON (community decks, themes, etc.)
