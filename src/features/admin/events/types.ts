export type EventOutcome = {
  handler: string;
  actions: Record<string, unknown>[];
};

export type EventRow = {
  id: string;
  userId: string;
  eventType: string;
  payload: Record<string, unknown>;
  receivedAt: string;
  status: "received" | "ok" | "failed";
  errorMsg: string | null;
  outcomes: EventOutcome[];
};

export type EventFilters = {
  userId?: string;
  eventType?: string;
  status?: EventRow["status"];
  since?: string;
  until?: string;
  limit?: number;
};

export type EventListResponse = {
  items: EventRow[];
  total: number;
};
