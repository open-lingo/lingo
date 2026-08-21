// refs.mjs — inbound-reference detection between docs.
// Docs reference each other by basename and FREQUENTLY drop the extension
// (`card-agnostic-reviews-2026-05-21` with no `.md`). Matching the full
// basename-with-extension misses those and wrongly reports zero inbound refs —
// which once caused the loop to archive a doc that was still referenced.
// So we match on the STEM (basename minus a trailing doc extension).

/** Stem = basename without a trailing .md/.txt. */
export function docStem(path) {
  const base = path.split("/").pop() || path;
  return base.replace(/\.(md|txt)$/i, "");
}

/** Does `text` mention the target doc (by stem, extension-agnostic)? */
export function mentionsDoc(text, targetPath) {
  const stem = docStem(targetPath);
  if (stem.length < 6) return text.includes(targetPath); // too-short stem → require full path
  return text.includes(stem);
}

/** Which of `corpus` (excluding the target itself) reference the target doc? */
export function inboundRefs(corpus, targetPath) {
  return corpus
    .filter((c) => c.f !== targetPath && mentionsDoc(c.text, targetPath))
    .map((c) => c.f);
}
