/** Mock: community courses the user has started and progress. */
export type CommunityModuleProgress = {
  addonId: string;
  completedCount: number;
};

const MOCK_COMMUNITY_PROGRESS: CommunityModuleProgress[] = [
  { addonId: "addon-3", completedCount: 5 }, // K-Drama Phrases, 12 total
];

export function getMockCommunityProgress(): CommunityModuleProgress[] {
  return [...MOCK_COMMUNITY_PROGRESS];
}

export function getCommunityProgressMap(): Map<string, number> {
  const list = getMockCommunityProgress();
  return new Map(list.map((p) => [p.addonId, p.completedCount]));
}
