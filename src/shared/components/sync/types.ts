/** Configuration for a sync source shown in the SyncManager popover. */
export type SyncSource = {
  id: string;
  label: string;
  /** ISO timestamp of last successful sync, or null if never synced. */
  lastSyncAt: string | null;
  /** ISO timestamp when next auto-sync will run, or null if not scheduled. */
  nextSyncAt: string | null;
  /** Number of unsynced items (e.g. cards, lessons). */
  dirtyCount: number;
  /** Callback to trigger manual sync. */
  onSyncNow: () => Promise<void>;
  /** Whether a sync is in progress. */
  syncing?: boolean;
  /** Whether this source is visible (e.g. SRS only on SRS pages). */
  visible: boolean;
  /**
   * Optional one-line diagnostic shown under the source rows, with an
   * optional force action. Added for the b20 reconciliation, which could
   * skip silently ~30 times in 15 minutes with the server access log as the
   * only way to find out.
   */
  diagnostic?: {
    line: string;
    actionLabel?: string;
    onAction?: () => Promise<void>;
  };
};
