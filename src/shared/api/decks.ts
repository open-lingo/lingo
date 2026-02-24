import { ApiClient } from "./client";

const PREFIX = "/api/core/v1/decks";

export interface DeckCreate {
  languageId: string;
  name: string;
  description?: string;
  image?: string;
  /** Initial ease for new cards (SM-2, 1.3–3.0). Omit = 2.5. */
  defaultEase?: number;
  status?: "draft" | "published";
  cards: DeckCard[];
  /** If set, deck is a companion deck (tied to a story). Excluded from community browse. */
  companionToStoryId?: string | null;
}

export interface DeckUpdate {
  languageId?: string;
  name?: string;
  description?: string;
  image?: string;
  defaultEase?: number;
  status?: "draft" | "published";
  cards?: DeckCard[];
  companionToStoryId?: string | null;
}

export interface DeckCard {
  id: string;
  front: string;
  back: string;
  type: "word" | "sentence" | "other";
  note?: string;
  image?: string;
  reasoning?: string;
  parts?: { segment: string; meaning?: string; particleId?: string }[];
  words?: { segment: string; meaning?: string; particleId?: string }[];
  definition?: string;
  context?: string;
}

export interface DeckResponse {
  id: string;
  languageId: string;
  name: string;
  description?: string;
  courseId?: string;
  authorId?: string;
  status: string;
  version: string;
  cardCount: number;
  image?: string;
  /** Initial ease for new cards (SM-2). */
  defaultEase?: number;
  locale?: string;
  createdAt?: string;
  updatedAt?: string;
  companionToStoryId?: string | null;
  cards: DeckCard[];
}

export class DecksApi extends ApiClient {
  async listMyDecks(params?: {
    language_id?: string;
    deck_status?: string;
    /** Exclude companion decks (for My Content / community browse). */
    exclude_companion_decks?: boolean;
  }): Promise<DeckResponse[]> {
    try {
      const p = params ?? {};
      const queryParams: Record<string, string> = {};
      if (p.language_id != null) queryParams.language_id = p.language_id;
      if (p.deck_status != null) queryParams.deck_status = p.deck_status;
      if (p.exclude_companion_decks === true) queryParams.exclude_companion_decks = "true";
      return await this.get<DeckResponse[]>(`${PREFIX}`, {
        params: queryParams,
      });
    } catch (err) {
      const status =
        err && typeof err === "object" && "status" in err
          ? (err as { status: number }).status
          : 0;
      if (status === 404 || status === 501) return [];
      throw err;
    }
  }

  async createDeck(body: DeckCreate): Promise<DeckResponse> {
    return this.post<DeckResponse>(`${PREFIX}`, body);
  }

  async getDeck(deckId: string): Promise<DeckResponse> {
    return this.get<DeckResponse>(`${PREFIX}/${deckId}`);
  }

  /** Fetch multiple decks by ID in one request. Returns only accessible decks. */
  async getDecksBatch(deckIds: string[]): Promise<DeckResponse[]> {
    if (deckIds.length === 0) return [];
    const ids = deckIds.join(",");
    return this.get<DeckResponse[]>(`${PREFIX}/batch`, {
      params: { ids },
    });
  }

  async updateDeck(deckId: string, body: DeckUpdate): Promise<DeckResponse> {
    return this.put<DeckResponse>(`${PREFIX}/${deckId}`, body);
  }

  async updateDeckStatus(
    deckId: string,
    status: "draft" | "published"
  ): Promise<DeckResponse> {
    return this.patch<DeckResponse>(
      `${PREFIX}/${deckId}/status?status=${status}`
    );
  }

  /** Get or create the user's 'My Vocab' deck for a language. */
  async getMyVocabDeck(languageId: string): Promise<DeckResponse> {
    return this.get<DeckResponse>(`${PREFIX}/my-vocab`, {
      params: { language_id: languageId },
    });
  }

  /** Append cards to a deck. User must own the deck. Dedupes by front+back. */
  async addCardsToDeck(deckId: string, cards: DeckCard[]): Promise<DeckResponse> {
    return this.post<DeckResponse>(
      `${PREFIX}/${encodeURIComponent(deckId)}/cards`,
      { cards }
    );
  }

  /** Admin: list all decks (no RBAC for now). */
  async listAdminDecks(params?: {
    status?: string;
    language_id?: string;
  }): Promise<DeckResponse[]> {
    try {
      return await this.get<DeckResponse[]>(`${PREFIX}/admin`, {
        params: params as Record<string, string>,
      });
    } catch (err) {
      const status =
        err && typeof err === "object" && "status" in err
          ? (err as { status: number }).status
          : 0;
      if (status === 404 || status === 501) return [];
      throw err;
    }
  }

  /** Admin: approve (published) or reject (draft) a deck. */
  async adminUpdateDeckStatus(
    deckId: string,
    status: "draft" | "published"
  ): Promise<DeckResponse> {
    return this.patch<DeckResponse>(
      `${PREFIX}/admin/${deckId}/status?status=${status}`
    );
  }
}
