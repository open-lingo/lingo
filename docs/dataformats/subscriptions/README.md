# Subscriptions

User subscriptions to content (decks, addons, stories). Stored in a **separate table** from user settings.

**Canonical doc:** [docs/dev/dataformats/subscriptions/README.md](../../../../docs/dev/dataformats/subscriptions/README.md)

**Summary (2026-05-25):** Fields include `enabled`, `newCardsPerDay`, `newCardOrder`. **No** `pinnedVersion` / deck snapshot pinning. Deck versioning strategy: [DECK_CONTENT_STORAGE.md](../../../../docs/dev/planning/DECK_CONTENT_STORAGE.md).
