import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApi } from "@/shared/api/provider";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import {
  AVAILABLE_LEARNING_LANGUAGES,
  AVAILABLE_LEARNING_LANGUAGE_IDS,
} from "@/shared/domain/languageConfig";
import { CommunityDecksLayout } from "./CommunityDecksLayout";
import { CommunityItemCard, type CommunityItemCardItem } from "./components/CommunityItemCard";
import type { DeckCreate, DeckResponse } from "@/shared/api/decks";

type CreationMode = "blank" | "duplicate";

function isValidEase(value: string): boolean {
  if (value.trim() === "") return true;
  const n = Number(value);
  return !Number.isNaN(n) && n >= 1.3 && n <= 3;
}

function parseEase(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const n = Number(value);
  if (Number.isNaN(n)) return undefined;
  return Math.max(1.3, Math.min(3, n));
}

function defaultLanguageId(currentId?: string | null): string {
  if (
    currentId &&
    (AVAILABLE_LEARNING_LANGUAGE_IDS as readonly string[]).includes(currentId)
  ) {
    return currentId;
  }
  return AVAILABLE_LEARNING_LANGUAGE_IDS[0];
}

export function DeckCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const langPath = useLangPath();
  const { language } = useLanguage();
  const { decks: decksApi } = useApi();

  const [name, setName] = useState("");
  const [languageId, setLanguageId] = useState<string>(defaultLanguageId(language?.id));
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [defaultEase, setDefaultEase] = useState("");
  const [mode, setMode] = useState<CreationMode>("blank");
  const [sourceDeckId, setSourceDeckId] = useState<string>("");
  const [myDecks, setMyDecks] = useState<DeckResponse[]>([]);
  const [myDecksLoading, setMyDecksLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ok = true;
    setMyDecksLoading(true);
    decksApi
      .listMyDecks({ exclude_companion_decks: true })
      .then((decks) => {
        if (ok) setMyDecks(decks);
      })
      .catch(() => {
        if (ok) setMyDecks([]);
      })
      .finally(() => {
        if (ok) setMyDecksLoading(false);
      });
    return () => {
      ok = false;
    };
  }, [decksApi]);

  const trimmedName = name.trim();
  const easeValid = isValidEase(defaultEase);
  const duplicateValid = mode !== "duplicate" || sourceDeckId !== "";
  const canSubmit =
    trimmedName.length > 0 &&
    languageId !== "" &&
    easeValid &&
    duplicateValid &&
    !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload: DeckCreate = {
        languageId,
        name: trimmedName,
        description: description.trim() || undefined,
        image: image.trim() || undefined,
        defaultEase: parseEase(defaultEase),
        status: "draft",
        cards: [],
      };

      if (mode === "duplicate" && sourceDeckId) {
        const source = await decksApi.getDeck(sourceDeckId);
        const sourceCards = source.cards ?? [];
        payload.cards = sourceCards.map((c) => ({
          ...c,
          id:
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `card-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        }));
      }

      const created = await decksApi.createDeck(payload);
      navigate(langPath(`community/decks/${created.id}`), { replace: true });
    } catch (err) {
      console.error("Create deck failed:", err);
      setError(t("community.deckCreateError"));
      setSubmitting(false);
    }
  }

  function handleCancel() {
    navigate(langPath("community/decks/mine"));
  }

  const previewItem: CommunityItemCardItem = {
    id: "preview",
    name: trimmedName || t("community.deckCreatePreviewPlaceholderName", "Untitled deck"),
    description:
      description.trim() ||
      t(
        "community.deckCreatePreviewPlaceholderDesc",
        "Your deck description will appear here.",
      ),
    languageId,
    kind: "flashcard-pack",
    itemCount: 0,
    upvoteCount: 0,
    image: image.trim() || null,
  };

  const rightRail = (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
          {t("community.deckCreatePreviewKicker", "Preview")}
        </p>
        <div className="pointer-events-none">
          <CommunityItemCard
            item={previewItem}
            variant="full"
            t={t}
            langPath={langPath}
            showCommunityBadge
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-muted p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {t("community.deckCreateTipsKicker", "Tips for a good deck")}
        </p>
        <ul className="mt-2 space-y-1.5 text-sm text-text-secondary">
          <li className="flex gap-2">
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-text-muted" aria-hidden />
            <span>
              {t(
                "community.deckCreateTipName",
                "Use a specific name (e.g. 'JLPT N5 vocabulary', not 'My deck')",
              )}
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-text-muted" aria-hidden />
            <span>
              {t(
                "community.deckCreateTipImage",
                "Add an image cover — decks with covers get more subscribers",
              )}
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-text-muted" aria-hidden />
            <span>
              {t(
                "community.deckCreateTipLanguage",
                "Pick the target language carefully — decks are filtered by language",
              )}
            </span>
          </li>
        </ul>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {t("community.deckCreateNextKicker", "What happens next")}
        </p>
        <ol className="mt-2 space-y-2 text-sm text-text-secondary">
          <li className="flex gap-2">
            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-muted text-[10px] font-semibold text-accent">
              1
            </span>
            <span>{t("community.deckCreateNextStep1", "Create the deck")}</span>
          </li>
          <li className="flex gap-2">
            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-muted text-[10px] font-semibold text-accent">
              2
            </span>
            <span>{t("community.deckCreateNextStep2", "Add and edit cards")}</span>
          </li>
          <li className="flex gap-2">
            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-muted text-[10px] font-semibold text-accent">
              3
            </span>
            <span>{t("community.deckCreateNextStep3", "Submit for community review")}</span>
          </li>
        </ol>
      </div>
    </div>
  );

  return (
    <CommunityDecksLayout
      rightRail={rightRail}
    >
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">
            {t("community.deckCreateTitle")}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {t("community.deckCreateSubtitle")}
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-border bg-surface p-6 shadow-sm"
        >
          <div>
            <label
              htmlFor="deck-name"
              className="mb-1 block text-sm font-medium text-text-primary"
            >
              {t("community.deckCreateNameLabel")}
              <span className="ml-1 text-red-500">*</span>
            </label>
            <input
              id="deck-name"
              type="text"
              autoFocus
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("community.deckCreateNamePlaceholder")}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </div>

          <div>
            <label
              htmlFor="deck-language"
              className="mb-1 block text-sm font-medium text-text-primary"
            >
              {t("community.deckCreateLanguageLabel")}
              <span className="ml-1 text-red-500">*</span>
            </label>
            <select
              id="deck-language"
              value={languageId}
              onChange={(e) => setLanguageId(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              required
            >
              {AVAILABLE_LEARNING_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="deck-description"
              className="mb-1 block text-sm font-medium text-text-primary"
            >
              {t("community.deckCreateDescriptionLabel")}
            </label>
            <textarea
              id="deck-description"
              maxLength={200}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label
              htmlFor="deck-image"
              className="mb-1 block text-sm font-medium text-text-primary"
            >
              {t("community.deckCreateImageLabel")}
            </label>
            <input
              id="deck-image"
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://example.com/cover.jpg"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label
              htmlFor="deck-ease"
              className="mb-1 flex items-center gap-1.5 text-sm font-medium text-text-primary"
            >
              {t("community.deckCreateDefaultEaseLabel")}
              <span
                tabIndex={0}
                role="button"
                aria-label={t(
                  "community.deckCreateDefaultEaseTooltip",
                  "Initial SM-2 ease factor for new cards in this deck (1.3–3.0). Higher = easier; cards graduate to longer intervals faster. Default 2.5 is fine for most decks.",
                )}
                title={t(
                  "community.deckCreateDefaultEaseTooltip",
                  "Initial SM-2 ease factor for new cards in this deck (1.3–3.0). Higher = easier; cards graduate to longer intervals faster. Default 2.5 is fine for most decks.",
                )}
                className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-border bg-surface text-[10px] font-semibold text-text-muted hover:border-accent hover:text-accent"
              >
                ?
              </span>
            </label>
            <input
              id="deck-ease"
              type="number"
              min={1.3}
              max={3}
              step={0.1}
              value={defaultEase}
              onChange={(e) => setDefaultEase(e.target.value)}
              placeholder="2.5"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
            {!easeValid && (
              <p className="mt-1 text-xs text-red-500">1.3 – 3.0</p>
            )}
          </div>

          <fieldset className="space-y-3">
            <legend className="mb-2 block text-sm font-medium text-text-primary">
              {t("community.deckCreateStartBlank")} /{" "}
              {t("community.deckCreateDuplicate")}
            </legend>

            <label
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                mode === "blank"
                  ? "border-accent bg-accent-muted/40"
                  : "border-border bg-surface hover:border-accent"
              }`}
            >
              <input
                type="radio"
                name="creation-mode"
                value="blank"
                checked={mode === "blank"}
                onChange={() => setMode("blank")}
                className="mt-1 shrink-0 border-border text-accent focus:ring-accent"
              />
              <div className="min-w-0">
                <div className="font-medium text-text-primary">
                  {t("community.deckCreateStartBlank")}
                </div>
                <p className="mt-0.5 text-sm text-text-secondary">
                  {t("community.deckCreateStartBlankDesc")}
                </p>
              </div>
            </label>

            <label
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                mode === "duplicate"
                  ? "border-accent bg-accent-muted/40"
                  : "border-border bg-surface hover:border-accent"
              }`}
            >
              <input
                type="radio"
                name="creation-mode"
                value="duplicate"
                checked={mode === "duplicate"}
                onChange={() => setMode("duplicate")}
                className="mt-1 shrink-0 border-border text-accent focus:ring-accent"
              />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-text-primary">
                  {t("community.deckCreateDuplicate")}
                </div>
                <p className="mt-0.5 text-sm text-text-secondary">
                  {t("community.deckCreateDuplicateDesc")}
                </p>
                {mode === "duplicate" && (
                  <div className="mt-3">
                    <label
                      htmlFor="deck-source"
                      className="mb-1 block text-xs font-medium text-text-secondary"
                    >
                      {t("community.deckCreateDuplicatePicker")}
                    </label>
                    <select
                      id="deck-source"
                      value={sourceDeckId}
                      onChange={(e) => setSourceDeckId(e.target.value)}
                      disabled={myDecksLoading || myDecks.length === 0}
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
                      required
                    >
                      <option value="">—</option>
                      {myDecks.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.cardCount})
                        </option>
                      ))}
                    </select>
                    {!myDecksLoading && myDecks.length === 0 && (
                      <p className="mt-1 text-xs text-text-muted">
                        {t("community.contentBrowserMineEmpty")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </label>
          </fieldset>

          {error && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={submitting}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-muted disabled:opacity-60"
            >
              {t("community.deckCreateCancel")}
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-accent-hover disabled:opacity-60"
            >
              {submitting
                ? t("community.editorSaving")
                : t("community.deckCreateCreateButton")}
            </button>
          </div>
        </form>
      </div>
    </CommunityDecksLayout>
  );
}
