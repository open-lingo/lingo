import { useCallback, useMemo, useState } from "react";
import { ModalBackdrop } from "@/shared/components/ModalBackdrop";
import { Button } from "@/shared/components/ui/Button";
import { useProgressMe } from "@/shared/hooks/useProgressMe";
import { getLocalLessonProgressSnapshot } from "@/shared/domain/mockProgress";

export function LearnProgressJsonOverlay({ onClose }: { onClose: () => void }) {
  const { summary, isLoading, refetch } = useProgressMe();
  const [copied, setCopied] = useState(false);

  const payload = useMemo(
    () => ({
      server: summary,
      local: getLocalLessonProgressSnapshot(),
    }),
    [summary],
  );

  const text = useMemo(() => JSON.stringify(payload, null, 2), [payload]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [text]);

  return (
    <ModalBackdrop onClose={onClose} ariaLabelledBy="progress-json-title">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-card border border-border bg-surface shadow-popover">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2
            id="progress-json-title"
            className="font-mono text-sm font-bold text-text-primary"
          >
            &lt;/&gt; Progress JSON
          </h2>
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void refetch()}
              disabled={isLoading}
            >
              {isLoading ? "Loading…" : "Refresh"}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={handleCopy}>
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
        <pre className="max-h-[calc(85vh-3.5rem)] overflow-auto p-4 font-mono text-xs leading-relaxed text-text-secondary">
          {text}
        </pre>
      </div>
    </ModalBackdrop>
  );
}
