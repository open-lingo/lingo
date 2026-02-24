import { ApiClient } from "./client";

const PREFIX = "/api/core/v1/stories";

export interface StoryCreate {
  languageId: string;
  title: string;
  description?: string;
  companionDeckId: string;
  body?: string;
}

export interface StoryUpdate {
  languageId?: string;
  title?: string;
  description?: string;
  companionDeckId?: string;
  body?: string;
}

export interface StoryResponse {
  id: string;
  languageId: string;
  title: string;
  description?: string;
  companionDeckId: string;
  body: string;
  authorId?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export class StoriesApi extends ApiClient {
  /** List published stories for browsing. Any authenticated user. */
  async listBrowseStories(params?: {
    language_id?: string;
  }): Promise<StoryResponse[]> {
    try {
      const p = params ?? {};
      const queryParams: Record<string, string> = {};
      if (p.language_id != null) queryParams.language_id = p.language_id;
      return await this.get<StoryResponse[]>(`${PREFIX}/browse`, {
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

  async listMyStories(params?: {
    language_id?: string;
    status?: string;
  }): Promise<StoryResponse[]> {
    try {
      const p = params ?? {};
      const queryParams: Record<string, string> = {};
      if (p.language_id != null) queryParams.language_id = p.language_id;
      if (p.status != null) queryParams.status = p.status;
      return await this.get<StoryResponse[]>(`${PREFIX}`, {
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

  async createStory(body: StoryCreate): Promise<StoryResponse> {
    return this.post<StoryResponse>(`${PREFIX}`, body);
  }

  async getStory(storyId: string): Promise<StoryResponse> {
    return this.get<StoryResponse>(`${PREFIX}/${storyId}`);
  }

  async updateStory(storyId: string, body: StoryUpdate): Promise<StoryResponse> {
    return this.put<StoryResponse>(`${PREFIX}/${storyId}`, body);
  }

  async updateStoryStatus(
    storyId: string,
    status: "draft" | "published"
  ): Promise<StoryResponse> {
    return this.patch<StoryResponse>(
      `${PREFIX}/${storyId}/status?status=${status}`,
    );
  }
}
