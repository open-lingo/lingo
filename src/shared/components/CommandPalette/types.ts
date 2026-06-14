import type { IconName } from "@/shared/iconRegistry";

/** A single actionable entry in the command palette. */
export type Command = {
  id: string;
  /** Primary label shown in the row. */
  label: string;
  /** Secondary text (path, description). */
  hint?: string;
  /** Group heading the row sorts under. */
  group: string;
  icon?: IconName;
  /** Extra text folded into search matching but not displayed. */
  keywords?: string;
  /** Run the command. The palette closes itself after this fires. */
  perform: () => void;
  /**
   * When false, the command is hidden until the user types (keeps the default
   * view short — used for the long content lists like vocab/lessons).
   */
  showWhenEmpty?: boolean;
};
