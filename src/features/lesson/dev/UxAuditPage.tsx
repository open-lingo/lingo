import { Link } from "react-router-dom";
import { UX_AUDIT, UX_AUDIT_META } from "./uxAudit/uxAuditData";

/**
 * DEV · /qa/ux-audit — review of the local 122B's UI/UX audit of the redesigned
 * mobile screens. The vision model (scripts/ux-loop/judge-suggest.mjs) produced
 * the suggestions; each is tagged with what we did — applied, skipped (with a
 * reason, e.g. it fought a deliberate design decision or was a screenshot
 * artifact), or deferred (minor polish). Before/after captures per screen.
 */

const SEV: Record<string, string> = {
  notable: "border-error/40 bg-error/15 text-error",
  minor: "border-warning/50 bg-warning/15 text-warning",
  polish: "border-border bg-surface-muted text-text-secondary",
};
const STATUS: Record<string, { cls: string; label: string }> = {
  applied: { cls: "border-success/50 bg-success/15 text-success", label: "✓ Applied" },
  skipped: { cls: "border-border bg-surface-muted text-text-muted", label: "— Skipped" },
  deferred: { cls: "border-accent/40 bg-accent-muted text-accent", label: "· Deferred" },
};

function Shot({ src, label, tone }: { src: string; label: string; tone: string }) {
  return (
    <figure className="m-0 flex-1">
      <figcaption className={`mb-1.5 font-mono text-[10px] uppercase tracking-widest ${tone}`}>{label}</figcaption>
      <img src={src} alt={label} loading="lazy" className="w-full rounded-xl border border-border shadow" />
    </figure>
  );
}

export default function UxAuditPage() {
  const c = UX_AUDIT_META.counts;
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="border-b border-border pb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">Dev · UX audit review · local 122B</p>
        <h1 className="mt-3 text-2xl font-bold text-text-primary sm:text-3xl">Mobile UI/UX — audit &amp; what we did</h1>
        <p className="mt-2 max-w-2xl text-sm text-text-secondary">
          {c.applied + c.skipped + c.deferred} suggestions from the local vision model, reviewed and acted on.
          Skips carry a reason (a deliberate design choice or a screenshot artifact); deferrals are minor polish.
          Judge for polish — the demo data reads empty. Source: <span className="font-mono">{UX_AUDIT_META.model}</span>.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full border border-success/50 bg-success/15 px-3 py-1 text-success">{c.applied} applied</span>
          <span className="rounded-full border border-border bg-surface-muted px-3 py-1 text-text-muted">{c.skipped} skipped</span>
          <span className="rounded-full border border-accent/40 bg-accent-muted px-3 py-1 text-accent">{c.deferred} deferred</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {UX_AUDIT.map((p) => (
            <a key={p.page} href={`#${p.page}`} className="rounded-full border border-border bg-surface-muted px-3 py-1 font-medium text-text-primary hover:bg-surface">
              {p.page} · {p.suggestions.length}
            </a>
          ))}
          <Link to="/home" className="rounded-full border border-border px-3 py-1 font-medium text-text-secondary hover:text-text-primary">← app</Link>
        </div>
      </header>

      <div className="mt-10 flex flex-col gap-16">
        {UX_AUDIT.map((p) => (
          <section key={p.page} id={p.page} className="scroll-mt-6">
            <h2 className="mb-4 text-lg font-bold capitalize text-text-primary">{p.page}</h2>
            <div className="grid gap-6 md:grid-cols-[minmax(0,320px)_1fr] md:items-start">
              <div className="md:sticky md:top-6">
                <div className="flex gap-3">
                  <Shot src={p.before} label="Before" tone="text-text-muted" />
                  <Shot src={p.after} label="After" tone="text-success" />
                </div>
              </div>
              <ul className="flex flex-col gap-3">
                {p.suggestions.map((s, i) => {
                  const st = STATUS[s.status] ?? STATUS.deferred;
                  return (
                    <li key={i} className="rounded-xl border border-border bg-surface px-4 py-3">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${st.cls}`}>{st.label}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${SEV[s.severity] ?? SEV.polish}`}>{s.severity}</span>
                        <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">{s.area}</span>
                      </div>
                      <p className="text-sm text-text-secondary"><span className="font-semibold text-text-primary">Issue:</span> {s.issue}</p>
                      <p className="mt-1 text-sm text-text-secondary"><span className="font-semibold text-accent">Model's fix:</span> {s.suggestion}</p>
                      {s.note && (
                        <p className="mt-1.5 border-t border-border pt-1.5 text-sm text-text-secondary">
                          <span className="font-semibold text-text-primary">What we did:</span> {s.note}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
