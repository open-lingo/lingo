import type { Command } from "./types";

/**
 * Filter + rank commands for a query.
 *
 * Empty query → only the always-on commands (nav + settings), in their
 * authored order. Non-empty → case-insensitive substring over label + hint +
 * keywords, ranked: label-prefix > label-substring > other-field match.
 */
export function filterCommands(commands: Command[], query: string): Command[] {
  const q = query.trim().toLowerCase();
  if (!q) return commands.filter((c) => c.showWhenEmpty);

  const scored: Array<{ cmd: Command; score: number; order: number }> = [];
  commands.forEach((cmd, order) => {
    const label = cmd.label.toLowerCase();
    const hay = `${label} ${cmd.hint ?? ""} ${cmd.keywords ?? ""}`.toLowerCase();
    let score = 0;
    if (label.startsWith(q)) score = 3;
    else if (label.includes(q)) score = 2;
    else if (hay.includes(q)) score = 1;
    if (score > 0) scored.push({ cmd, score, order });
  });

  return scored
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .map((s) => s.cmd);
}
