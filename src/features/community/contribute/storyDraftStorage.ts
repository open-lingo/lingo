const STORAGE_KEY = "open-lingo-story-draft";

export type StoryDraft = {
  title: string;
  description: string;
  languageId: string;
  body: string;
  companionDeckId: string | null;
  companionDeck: { name: string; cardCount: number } | null;
};

const EMPTY: StoryDraft = {
  title: "",
  description: "",
  languageId: "ko",
  body: "",
  companionDeckId: null,
  companionDeck: null,
};

export function loadStoryDraft(): StoryDraft {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<StoryDraft>;
    return {
      title: parsed.title ?? "",
      description: parsed.description ?? "",
      languageId: parsed.languageId ?? "ko",
      body: parsed.body ?? "",
      companionDeckId: parsed.companionDeckId ?? null,
      companionDeck: parsed.companionDeck ?? null,
    };
  } catch {
    return { ...EMPTY };
  }
}

export function saveStoryDraft(draft: StoryDraft): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // quota or other
  }
}

export function clearStoryDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
