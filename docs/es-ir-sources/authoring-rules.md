# ES IR authoring rules

## Hard rule: dialogue_sim NPC lines

`esSurfaces()` has no `dialogue_sim` case, so NPC lines (`kana`/`audioText`) are invisible to the usual vocab/bar scans — the unregistered plural «de niños» (only «de niño» is registered, m22) shipped in both m26 and m27 unnoticed by any scan, caught only by human review both times (a3580612, 0be21768). Every NPC line, not just graded replies, must resolve to atoms registered by that lesson's module — machine-enforced by `es-quality.test.ts` → describe("ES quality — dialogue_sim content resolves to registered atoms"). Exception: an NPC line (never a reply) may intentionally run ahead of taught vocabulary as an exposure device — the established "rapido"/"despacio" pattern — but only when rescued by a registered fixed phrase (e.g. "no entiendo"); replies stay bound to that lesson's module. Before shipping a sim, check its new NPC lines against the atom registry the same way you'd check a reply.
