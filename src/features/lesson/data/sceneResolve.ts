import type { RegisterSpec, SceneSpec } from "@/features/lesson/types";
import {
  DEFAULT_REGISTER_CAST,
  castView,
} from "@/features/languages/ja/registerCast";
import { lookupKanaEmoji, notoEmojiUrl } from "@/shared/assets/notoEmoji";

/**
 * IR authoring form → runtime scene.
 *
 * Most scenes are plain data and pass straight through. Two carry art, and art
 * must NOT be authored into YAML:
 *
 *   - a `register` scene names its `cast` by id and gets faces from
 *     `registerCast.ts`, so regenerating a portrait cannot leave a stale path
 *     baked into six modules;
 *   - a `scale` item names a taught word and gets the SAME picture the learner
 *     met on its flashcard, resolved through the course's own vocab map.
 *
 * Both are one-way: the IR is the front door, and nothing here reads back out
 * of a compiled module.
 */

/** A `register` scene as AUTHORED — cast by id, not by portrait. */
export type IrRegisterSpec = Omit<RegisterSpec, "audiences"> & {
  cast?: readonly string[];
};

export type IrSceneSpec = Exclude<SceneSpec, RegisterSpec> | IrRegisterSpec;

export function resolveScene(spec: IrSceneSpec): SceneSpec;
export function resolveScene(spec: IrSceneSpec | undefined): SceneSpec | undefined;
export function resolveScene(
  spec: IrSceneSpec | undefined,
): SceneSpec | undefined {
  if (!spec) return undefined;

  if (spec.kind === "register") {
    const ids = spec.cast ?? DEFAULT_REGISTER_CAST;
    const { cast: _authored, ...rest } = spec;
    const audiences = ids.map(castView);
    for (const a of audiences) {
      if (!spec.forms[a.politeness]) {
        throw new Error(
          `register scene names ${a.id} (politeness ${a.politeness}) but has no form for that level`,
        );
      }
    }
    return { ...rest, audiences };
  }

  if (spec.kind === "scale") {
    return {
      ...spec,
      items: spec.items.map((it) => {
        if (it.artUrl !== undefined) return it;
        const { emoji: authored, ...rest } = it;
        const glyph = lookupKanaEmoji(it.label) ?? authored;
        return glyph ? { ...rest, artUrl: notoEmojiUrl(glyph) } : rest;
      }),
    };
  }

  return spec;
}
