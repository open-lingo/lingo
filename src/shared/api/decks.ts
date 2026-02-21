import { ApiClient } from "./client";

const PREFIX = "/api/core/decks/v1";

export interface DeckCreate {
  languageId: string;
  name: string;
  description?: string;
  image?: string;
  /** Initial ease for new cards (SM-2, 1.3–3.0). Omit = 2.5. */
  defaultEase?: number;
  status?: "draft" | "published";
  cards: DeckCard[];
}

export interface DeckUpdate {
  languageId?: string;
  name?: string;
  description?: string;
  image?: string;
  defaultEase?: number;
  status?: "draft" | "published";
  cards?: DeckCard[];
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
  cards: DeckCard[];
}

export class DecksApi extends ApiClient {
  async listMyDecks(params?: {
    language_id?: string;
    deck_status?: string;
  }): Promise<DeckResponse[]> {
    try {
      return await this.get<DeckResponse[]>(`${PREFIX}/decks`, {
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

  async createDeck(body: DeckCreate): Promise<DeckResponse> {
    return this.post<DeckResponse>(`${PREFIX}/decks`, body);
  }

  async getDeck(deckId: string): Promise<DeckResponse> {
    return this.get<DeckResponse>(`${PREFIX}/decks/${deckId}`);
  }

  /** Fetch multiple decks by ID in one request. Returns only accessible decks. */
  async getDecksBatch(deckIds: string[]): Promise<DeckResponse[]> {
    if (deckIds.length === 0) return [];
    const ids = deckIds.join(",");
    return this.get<DeckResponse[]>(`${PREFIX}/decks/batch`, {
      params: { ids },
    });
  }

  async updateDeck(deckId: string, body: DeckUpdate): Promise<DeckResponse> {
    return this.put<DeckResponse>(`${PREFIX}/decks/${deckId}`, body);
  }

  async updateDeckStatus(
    deckId: string,
    status: "draft" | "published"
  ): Promise<DeckResponse> {
    return this.patch<DeckResponse>(
      `${PREFIX}/decks/${deckId}/status?status=${status}`
    );
  }

  /** Admin: list all decks (no RBAC for now). */
  async listAdminDecks(params?: {
    status?: string;
    language_id?: string;
  }): Promise<DeckResponse[]> {
    try {
      return await this.get<DeckResponse[]>(`${PREFIX}/decks/admin`, {
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
      `${PREFIX}/decks/admin/${deckId}/status?status=${status}`
    );
  }
}
