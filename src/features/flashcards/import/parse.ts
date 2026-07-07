/**
 * Structural validation for the `known-items export v1` schema
 * (anki-import-spec-2026-07-07 §parse.ts). Hand-rolled guards in the style of
 * `srsStorage.isModalFsrsState` — no new deps. Tolerates unknown extra fields
 * (forward-compat), enforces `version === 1`, and throws `ImportParseError`
 * with a human-readable message on any shape violation.
 */
import type {
  EvidenceClass,
  KnownItem,
  KnownItemEvidence,
  KnownItemsExport,
} from "./types";

/** Thrown by {@link parseKnownItemsExport} on any structural violation. */
export class ImportParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportParseError";
  }
}

const EVIDENCE_CLASSES: ReadonlySet<string> = new Set<EvidenceClass>([
  "active",
  "suspended-reviewed",
]);

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function parseEvidence(raw: unknown, where: string): KnownItemEvidence {
  if (!isObject(raw)) {
    throw new ImportParseError(`${where}: "evidence" must be an object.`);
  }
  if (typeof raw.class !== "string" || !EVIDENCE_CLASSES.has(raw.class)) {
    throw new ImportParseError(
      `${where}: evidence.class must be "active" or "suspended-reviewed".`,
    );
  }
  if (!isFiniteNumber(raw.intervalDays)) {
    throw new ImportParseError(`${where}: evidence.intervalDays must be a number.`);
  }
  if (!isFiniteNumber(raw.reps)) {
    throw new ImportParseError(`${where}: evidence.reps must be a number.`);
  }
  if (!isFiniteNumber(raw.lapses)) {
    throw new ImportParseError(`${where}: evidence.lapses must be a number.`);
  }
  if (raw.lastReviewAt !== undefined && typeof raw.lastReviewAt !== "string") {
    throw new ImportParseError(`${where}: evidence.lastReviewAt must be a string when present.`);
  }
  if (raw.source !== undefined && typeof raw.source !== "string") {
    throw new ImportParseError(`${where}: evidence.source must be a string when present.`);
  }
  const evidence: KnownItemEvidence = {
    class: raw.class as EvidenceClass,
    intervalDays: raw.intervalDays,
    reps: raw.reps,
    lapses: raw.lapses,
  };
  if (typeof raw.lastReviewAt === "string") evidence.lastReviewAt = raw.lastReviewAt;
  if (typeof raw.source === "string") evidence.source = raw.source;
  return evidence;
}

function parseItem(raw: unknown, where: string): KnownItem {
  if (!isObject(raw)) {
    throw new ImportParseError(`${where}: each item must be an object.`);
  }
  if (typeof raw.expression !== "string" || raw.expression.trim() === "") {
    throw new ImportParseError(`${where}: "expression" must be a non-empty string.`);
  }
  if (raw.reading !== undefined && typeof raw.reading !== "string") {
    throw new ImportParseError(`${where}: "reading" must be a string when present.`);
  }
  if (raw.meaning !== undefined && typeof raw.meaning !== "string") {
    throw new ImportParseError(`${where}: "meaning" must be a string when present.`);
  }
  const item: KnownItem = {
    expression: raw.expression,
    evidence: parseEvidence(raw.evidence, where),
  };
  if (typeof raw.reading === "string") item.reading = raw.reading;
  if (typeof raw.meaning === "string") item.meaning = raw.meaning;
  return item;
}

/**
 * Validate + narrow an unknown value (typically `JSON.parse` output) to a
 * {@link KnownItemsExport}. Throws {@link ImportParseError} on any violation.
 */
export function parseKnownItemsExport(input: unknown): KnownItemsExport {
  if (!isObject(input)) {
    throw new ImportParseError("Import file must be a JSON object.");
  }
  if (input.version !== 1) {
    throw new ImportParseError(
      `Unsupported export version: ${JSON.stringify(input.version)} (expected 1).`,
    );
  }
  if (typeof input.language !== "string" || input.language.trim() === "") {
    throw new ImportParseError('"language" must be a non-empty string.');
  }
  if (typeof input.source !== "string" || input.source.trim() === "") {
    throw new ImportParseError('"source" must be a non-empty string.');
  }
  if (typeof input.exportedAt !== "string") {
    throw new ImportParseError('"exportedAt" must be a string.');
  }
  if (!Array.isArray(input.items)) {
    throw new ImportParseError('"items" must be an array.');
  }
  const items = input.items.map((raw, i) => parseItem(raw, `item[${i}]`));
  return {
    version: 1,
    language: input.language,
    source: input.source,
    exportedAt: input.exportedAt,
    items,
  };
}
