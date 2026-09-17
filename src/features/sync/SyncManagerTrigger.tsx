import { useSRSSyncSource } from "@/features/flashcards/useSRSSyncSource";
import { useLessonSyncSource } from "@/features/lesson/useLessonSyncSource";
import { SyncManager } from "@/shared/components/sync";
import { LayoutTracePanel } from "./LayoutTracePanel";
import { ResetDiagnosticsPanel } from "./ResetDiagnosticsPanel";

/**
 * Renders the SyncManager with all registered sync sources.
 * Add more sources here as we add story progress, etc.
 *
 * `extra` carries the two on-device diagnostics added for TestFlight #174
 * (layout-jump trace) and #176a (stuck reset-flag / local-vs-server lesson
 * count) — both readable and actionable from the phone, no Mac needed.
 */
export function SyncManagerTrigger({ dropUp = false }: { dropUp?: boolean } = {}) {
  const srsSource = useSRSSyncSource();
  const lessonSource = useLessonSyncSource();
  const sources = [srsSource, lessonSource];

  return (
    <SyncManager
      sources={sources}
      dropUp={dropUp}
      extra={
        <>
          <LayoutTracePanel />
          <ResetDiagnosticsPanel />
        </>
      }
    />
  );
}
