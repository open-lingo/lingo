import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/shared/api/provider";

/**
 * Admin synthetic event publisher.
 *
 * Drops a kombu envelope onto the same broker the real producers use —
 * lingo-async picks it up like any other event. Quests advance, the
 * leaderboard updates, the event lands in the inspector below.
 *
 * Useful for: faking lesson completions for a different user_id (so the
 * leaderboard has competitors), QA-ing quest evaluation rules without
 * driving the lesson UI, repro-ing a real event from /admin/events by
 * tweaking the JSON.
 *
 * Architecture gotcha (real bug 2026-05-31): the XP-credit pipeline is
 * split by event type. ``lesson_completed`` ONLY fires quest evaluation —
 * the consumer does NOT credit XP, because in the hot path lingo-core's
 * ``/progress/lessons/batch`` credits user.xp INLINE before publishing.
 * ``xp_awarded`` with ``source != "lesson"`` is the consumer-credit path.
 * Sending an ``xp_awarded`` with ``source="lesson"`` is a no-op for user
 * XP — the consumer skips it assuming the producer already credited.
 * Templates below default ``xp_awarded`` to ``source="manual"`` so the
 * admin-publish-then-credit happy path works without further thought.
 */

interface TemplateMeta {
  payload: Record<string, unknown>;
  /** Single-line behavior summary shown beside the type select. */
  hint: string;
}

const TEMPLATES: Record<string, TemplateMeta> = {
  xp_awarded: {
    payload: {
      amount: 25,
      // source MUST be "manual" (or "quest"/"streak"/"review") to credit
      // the user. "lesson" causes the consumer to skip, because in real
      // flows the producer credits inline before publishing.
      source: "manual",
      learning_language_id: "ja",
      leaderboard_opt_in: true,
    },
    hint: "Credits user XP + updates leaderboard. Use source=manual.",
  },
  lesson_completed: {
    payload: {
      lesson_id: "m3-l1",
      score: 1.0,
      perfect: true,
      attempted_at: "2026-05-31T00:00:00Z",
    },
    hint: "Quest evaluation only — does NOT credit XP. Use xp_awarded for XP.",
  },
  review_completed: {
    payload: {
      card_id: "synth-1",
      modality: "recognition",
      rating: "good",
      count: 5,
    },
    hint: "Advances card-count quests. Does NOT touch SRS state or XP.",
  },
  friend_added: {
    payload: {
      friend_id: "00000000-0000-0000-0000-000000000000",
    },
    hint: "Advances social quests for user_id (not friend_id).",
  },
  subscription_changed: {
    payload: {
      tier: "supporter",
      event: "new",
    },
    hint: "Stub handler — currently no side effects.",
  },
};

const EVENT_TYPES = Object.keys(TEMPLATES);

export function EventPublisher() {
  const { ops } = useApi();
  const qc = useQueryClient();
  const [userId, setUserId] = useState("");
  const [eventType, setEventType] = useState<string>("xp_awarded");
  const [payloadText, setPayloadText] = useState(
    JSON.stringify(TEMPLATES.xp_awarded.payload, null, 2),
  );
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(payloadText);
      } catch (e) {
        throw new Error(`Invalid JSON: ${(e as Error).message}`);
      }
      return ops.publishEvent({ userId, eventType, payload });
    },
    onSuccess: () => {
      setError(null);
      // Inspector list lives behind the same query key — refetch so the
      // new row shows up immediately.
      qc.invalidateQueries({ queryKey: ["ops", "events", "list"] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : String(e)),
  });

  const handleTypeChange = (next: string) => {
    setEventType(next);
    const tpl = TEMPLATES[next];
    setPayloadText(JSON.stringify(tpl?.payload ?? {}, null, 2));
  };

  const activeHint = TEMPLATES[eventType]?.hint;

  return (
    <section className="border-t border-border p-4 space-y-3 text-sm bg-surface-muted">
      <header className="flex items-center justify-between">
        <h3 className="font-semibold">Publish synthetic event</h3>
        <span className="text-xs text-text-muted">
          Fakes a producer call. Quests + leaderboard react as if real.
        </span>
      </header>
      <div className="grid grid-cols-[10rem_1fr] gap-3 items-center">
        <label htmlFor="evtype" className="text-xs text-text-muted">event_type</label>
        <select
          id="evtype"
          value={eventType}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="px-2 py-1 border rounded"
        >
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {activeHint ? (
          <>
            <span className="text-xs text-text-muted" />
            <p
              className="text-xs text-warning -mt-1"
              data-testid="event-hint"
            >
              {activeHint}
            </p>
          </>
        ) : null}

        <label htmlFor="evuser" className="text-xs text-text-muted">user_id</label>
        <input
          id="evuser"
          type="text"
          value={userId}
          placeholder="paste a user UUID (or your own from the inspector)"
          onChange={(e) => setUserId(e.target.value)}
          className="px-2 py-1 border rounded font-mono text-xs"
        />

        <label htmlFor="evpayload" className="text-xs text-text-muted self-start mt-1">
          payload JSON
        </label>
        <textarea
          id="evpayload"
          rows={8}
          value={payloadText}
          onChange={(e) => setPayloadText(e.target.value)}
          className="px-2 py-1 border rounded font-mono text-xs"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={!userId || mutation.isPending}
          onClick={() => mutation.mutate()}
          className="px-3 py-1.5 rounded bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent-hover disabled:opacity-50"
        >
          {mutation.isPending ? "Publishing…" : "Publish event"}
        </button>
        {mutation.isSuccess && (
          <span className="text-xs text-success">
            Published. Event should appear in the inspector within ~3s.
          </span>
        )}
        {error && <span className="text-xs text-error">{error}</span>}
      </div>
    </section>
  );
}
