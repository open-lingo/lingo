import { useSRSSyncSource } from "@/features/flashcards/useSRSSyncSource";
import { SyncManager } from "@/shared/components/sync";

/**
 * Renders the SyncManager with all registered sync sources.
 * Add more sources here as we add lessons, story progress, etc.
 */
export function SyncManagerTrigger() {
  const srsSource = useSRSSyncSource();
  const sources = [srsSource];

  return <SyncManager sources={sources} />;
}
