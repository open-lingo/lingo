import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { DeckPreviewModal } from "@/features/flashcards/DeckPreviewModal";
import { StoryPreviewModal } from "@/features/stories/StoryPreviewModal";
import type { FlashcardDeck } from "@/features/flashcards/data/types";
import type { DeckPreviewAuthor } from "@/features/flashcards/components/DeckPreviewHeader";
import type { CommunityAddon } from "./types";
import type { StoryResponse } from "@/shared/api/stories";

type DeckPreviewOptions = {
  onSubscriptionChange?: () => void;
  /** Resolved author (name + avatar) for the deck masthead. */
  author?: DeckPreviewAuthor;
  /** Caller-known upvote count (e.g. from the marketplace item). */
  upvoteCount?: number;
};

type StoryPreviewOptions = {
  onSubscriptionChange?: () => void;
  isSubscribed?: boolean;
  onSubscribe?: () => void;
  onUnsubscribe?: () => void;
  subscribeLoading?: boolean;
};

type CommunityContentContextValue = {
  openDeckPreview: (
    deck: FlashcardDeck | null,
    addon: CommunityAddon | null,
    options?: DeckPreviewOptions
  ) => void;
  openStoryPreview: (story: StoryResponse | null, options?: StoryPreviewOptions) => void;
  closePreview: () => void;
};

const CommunityContentContext = createContext<CommunityContentContextValue | null>(null);

export function CommunityContentProvider({ children }: { children: ReactNode }) {
  const [previewDeck, setPreviewDeck] = useState<FlashcardDeck | null>(null);
  const [previewAddon, setPreviewAddon] = useState<CommunityAddon | null>(null);
  const [previewStory, setPreviewStory] = useState<StoryResponse | null>(null);
  const [deckPreviewOptions, setDeckPreviewOptions] = useState<DeckPreviewOptions>({});
  const [storyPreviewOptions, setStoryPreviewOptions] = useState<StoryPreviewOptions>({});

  const openDeckPreview = useCallback(
    (deck: FlashcardDeck | null, addon: CommunityAddon | null, options?: DeckPreviewOptions) => {
      setPreviewDeck(deck);
      setPreviewAddon(addon);
      setPreviewStory(null);
      setDeckPreviewOptions(options ?? {});
      setStoryPreviewOptions({});
    },
    []
  );

  const openStoryPreview = useCallback(
    (story: StoryResponse | null, options?: StoryPreviewOptions) => {
      setPreviewStory(story);
      setPreviewDeck(null);
      setPreviewAddon(null);
      setStoryPreviewOptions(options ?? {});
      setDeckPreviewOptions({});
    },
    []
  );

  const closePreview = useCallback(() => {
    setPreviewDeck(null);
    setPreviewAddon(null);
    setPreviewStory(null);
    setDeckPreviewOptions({});
    setStoryPreviewOptions({});
  }, []);

  const showDeckPreview = previewDeck != null || previewAddon != null;
  const showStoryPreview = previewStory != null;

  return (
    <CommunityContentContext.Provider
      value={{ openDeckPreview, openStoryPreview, closePreview }}
    >
      {children}
      {showDeckPreview && (
        <DeckPreviewModal
          deck={previewDeck}
          addon={previewAddon}
          author={deckPreviewOptions.author}
          upvoteCount={deckPreviewOptions.upvoteCount}
          onClose={closePreview}
          onSubscriptionChange={deckPreviewOptions.onSubscriptionChange}
        />
      )}
      {showStoryPreview && (
        <StoryPreviewModal
          story={previewStory}
          onClose={closePreview}
          onSubscriptionChange={storyPreviewOptions.onSubscriptionChange}
          isSubscribed={storyPreviewOptions.isSubscribed}
          onSubscribe={storyPreviewOptions.onSubscribe}
          onUnsubscribe={storyPreviewOptions.onUnsubscribe}
          subscribeLoading={storyPreviewOptions.subscribeLoading}
        />
      )}
    </CommunityContentContext.Provider>
  );
}

export function useCommunityContent(): CommunityContentContextValue {
  const ctx = useContext(CommunityContentContext);
  if (!ctx) {
    throw new Error("useCommunityContent must be used within CommunityContentProvider");
  }
  return ctx;
}
