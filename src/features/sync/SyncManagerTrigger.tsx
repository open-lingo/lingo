import { useSRSSyncSource } from "@/features/flashcards/useSRSSyncSource";
import { useLessonSyncSource } from "@/features/lesson/useLessonSyncSource";
import { SyncManager } from "@/shared/components/sync";

/**
 * Renders the SyncManager with all registered sync sources.
 * Add more sources here as we add story progress, etc.
 */
export function SyncManagerTrigger({ dropUp = false }: { dropUp?: boolean } = {}) {
  const srsSource = useSRSSyncSource();
  const lessonSource = useLessonSyncSource();
  const sources = [srsSource, lessonSource];

  return <SyncManager sources={sources} dropUp={dropUp} />;
}
