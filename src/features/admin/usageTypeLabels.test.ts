import { describe, it, expect } from "vitest";
import { prettyUsageType } from "./usageTypeLabels";

describe("prettyUsageType", () => {
  it("maps S3 request tiers", () => {
    expect(prettyUsageType("USE1-Requests-Tier1")).toBe("PUT/COPY/POST/LIST requests");
    expect(prettyUsageType("USE1-Requests-Tier2")).toBe("GET requests");
  });

  it("maps storage, transfer, compute and DynamoDB units", () => {
    expect(prettyUsageType("USE1-TimedStorage-ByteHrs")).toBe("Storage");
    expect(prettyUsageType("USE1-DataTransfer-Out-Bytes")).toBe("Data transfer out");
    expect(prettyUsageType("Lambda-GB-Second")).toBe("Compute (GB-s)");
    expect(prettyUsageType("USE1-ReadRequestUnits")).toBe("Reads (RRU)");
    expect(prettyUsageType("USE1-WriteRequestUnits")).toBe("Writes (WRU)");
  });

  it("maps CloudFront HTTPS tier before the generic Tier2 pattern", () => {
    expect(prettyUsageType("Requests-Tier2-HTTPS")).toBe("HTTPS requests");
  });

  it("falls through to the region-stripped raw name for unknown types", () => {
    expect(prettyUsageType("USW2-SomeNewThing-Bytes")).toBe("SomeNewThing-Bytes");
    // No region prefix → unchanged.
    expect(prettyUsageType("TimedBackupStorage-ByteHrs")).toBe("TimedBackupStorage-ByteHrs");
  });
});
