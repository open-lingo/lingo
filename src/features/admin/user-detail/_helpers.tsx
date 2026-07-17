import type { SRSCardState, SRSModalityState } from "@/features/flashcards/data/types";
import { isLegacyFlatFsrsState, migrateFlatToModal } from "@/features/flashcards/engine";
import { Badge } from "@/shared/components/ui/Badge";

/**
 * Why: server returns SRS payloads as opaque blobs, so legacy flat FSRS
 * rows or partially-migrated rows reach the admin view missing the modal
 * `recognition` / `production` shape. Without this, `state.recognition.dueDate`
 * throws at render time.
 */
export const EMPTY_MODALITY: SRSModalityState = {
  stability: 0,
  difficulty: 0,
  state: "new",
  interval: 0,
  dueDate: "",
  lastReviewDate: "",
  reps: 0,
  lapses: 0,
};

export function normalizeAdminSrsCard(raw: unknown): SRSCardState {
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (
      obj.recognition &&
      typeof obj.recognition === "object" &&
      obj.production &&
      typeof obj.production === "object"
    ) {
      return obj as unknown as SRSCardState;
    }
    if (isLegacyFlatFsrsState(raw)) return migrateFlatToModal(raw);
    return {
      recognition: { ...EMPTY_MODALITY, ...((obj.recognition as object) ?? {}) },
      production: { ...EMPTY_MODALITY, ...((obj.production as object) ?? {}) },
      lastSyncedAt: typeof obj.lastSyncedAt === "string" ? obj.lastSyncedAt : undefined,
      lastReviewedAt: typeof obj.lastReviewedAt === "string" ? obj.lastReviewedAt : undefined,
      buriedUntil: typeof obj.buriedUntil === "string" ? obj.buriedUntil : undefined,
    };
  }
  return { recognition: { ...EMPTY_MODALITY }, production: { ...EMPTY_MODALITY } };
}

/** ISO string → `datetime-local` input value (local wall-clock). */
export function toLocalDatetimeValue(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Admin SRS edit surface — patches apply to both modalities when they
 * touch per-modality fields (dueDate, difficulty), or to the card-shared
 * fields (buriedUntil, lastSyncedAt). For per-modality editing the admin
 * would need a richer UI; this matches Card Manager's "single column,
 * both modalities" behavior.
 */
export type AdminCardPatch = {
  dueDate?: string;
  difficulty?: number;
  buriedUntil?: string | undefined;
  lastSyncedAt?: string | undefined;
};

/** Compact Active/Banned status pill with an optional "until <date>" tail. */
export function StatusPill({
  label,
  status,
  untilLabel,
}: {
  label: string;
  status: string | null | undefined;
  untilLabel: string | null;
}) {
  const banned = status === "banned";
  const active = status === "active";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-xs text-text-muted">{label}</span>
      <Badge size="sm" variant={banned ? "error" : active ? "success" : "neutral"}>
        {banned ? "Banned" : active ? "Active" : "—"}
      </Badge>
      {banned && untilLabel ? (
        <span className="text-xs text-text-muted">until {untilLabel}</span>
      ) : null}
    </span>
  );
}
