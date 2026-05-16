import { ApiClient } from "./client";

const PREFIX = "/api/core/v1/finance";

export type FundingTransparency = {
  adFundedPercent: number;
  premiumPercent: number;
  source: "manual" | "estimated" | "live";
  periodLabel: string;
  updatedAt?: string | null;
};

export class FinanceApi extends ApiClient {
  /** Public sustainability split for the funding meter (no auth). */
  async getTransparency(signal?: AbortSignal): Promise<FundingTransparency> {
    return this.get<FundingTransparency>(`${PREFIX}/transparency`, {
      signal,
      tag: "finance:transparency",
    });
  }
}
