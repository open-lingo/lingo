import { Link } from "react-router-dom";
import type { TFunction } from "i18next";
import { DataTable, type DataTableColumn } from "@/shared/components/data";
import { Icon } from "@/shared/components/Icon";
import type { AuthoredDeck } from "../useAuthoredDecks";

/**
 * Authored decks as a DataTable — name (linked) / language / per-deck
 * upvotes. Uses the shared DataTable so the creator surface matches the
 * rest of the app's tabular data instead of bespoke list rows.
 */
export function AuthoredDecksTable({
  decks,
  t,
}: {
  decks: AuthoredDeck[];
  t: TFunction;
}) {
  const columns: DataTableColumn<AuthoredDeck>[] = [
    {
      key: "name",
      label: t("profile.publicAuthoredColName", "Deck"),
      render: (d) => (
        <Link
          to={`/decks/${d.id}`}
          className="font-medium text-text-primary hover:text-accent"
        >
          {d.name || t("profile.publicUnnamedDeck", "(unnamed deck)")}
        </Link>
      ),
    },
    {
      key: "language",
      label: t("profile.publicAuthoredColLanguage", "Language"),
      className: "hidden sm:table-cell",
      render: (d) => (
        <span className="text-text-secondary">{d.language ?? "—"}</span>
      ),
    },
    {
      key: "upvotes",
      label: t("profile.publicAuthoredColUpvotes", "Upvotes"),
      className: "text-right",
      render: (d) => (
        <span className="inline-flex items-center gap-1 tabular-nums text-text-secondary">
          <Icon name="chevronUp" size={12} aria-hidden />
          {d.upvotes.toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <DataTable<AuthoredDeck>
      columns={columns}
      rows={decks}
      getRowKey={(d) => d.id}
      emptyMessage={t(
        "profile.publicAuthoredEmpty",
        "No published decks yet.",
      )}
    />
  );
}
