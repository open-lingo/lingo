import { ApiClient } from "./client";

const PREFIX = "/api/core/v1/quests";

export interface ServerQuestProgress {
  current: number;
  target: number;
  unit: string;
}

export interface ServerQuestRewards {
  lingots?: number | null;
  xp?: number | null;
  adFreeMinutes?: number | null;
  streakShield?: boolean | null;
}

export interface ServerQuest {
  id: string;
  type: "daily" | "weekly" | "random" | "friend";
  title: string;
  description: string;
  emoji: string;
  progress: ServerQuestProgress;
  rewards: ServerQuestRewards;
  expiresAt?: number | null;
  friendId?: string | null;
  friendDisplayName?: string | null;
  status: "active" | "claimable" | "completed" | "expired";
}

export interface ServerQuestList {
  items: ServerQuest[];
}

export class QuestsApi extends ApiClient {
  async list(): Promise<ServerQuestList> {
    return this.get<ServerQuestList>(PREFIX, { tag: "quests:list" });
  }

  async bumpProgress(id: string, delta: number): Promise<ServerQuest> {
    return this.post<ServerQuest>(
      `${PREFIX}/${encodeURIComponent(id)}/progress`,
      { delta },
      { tag: "quests:bump" },
    );
  }

  async claim(id: string): Promise<{
    quest: ServerQuest;
    lingotsGranted: number;
    xpGranted: number;
    rewardGranted: boolean;
  }> {
    return this.post(
      `${PREFIX}/${encodeURIComponent(id)}/claim`,
      {},
      { tag: "quests:claim" },
    );
  }

  async refresh(): Promise<{ removed: number; seeded: number }> {
    return this.post(`${PREFIX}/refresh`, {}, { tag: "quests:refresh" });
  }
}
