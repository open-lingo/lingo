/**
 * Prettify AWS Cost Explorer USAGE_TYPE strings for the cost drilldown.
 *
 * Raw values look like "USE1-Requests-Tier2" — a region prefix plus a
 * billing meter name. We strip the region and map the common meters to
 * plain English. Unknown types fall through to the region-stripped raw
 * name so new meters still surface without a code change.
 */

// Region prefixes are ALL-CAPS + optional digit ("USE1-", "USW2-", "APN1-",
// "EU-", "EUC1-"). Meter names are MixedCase, so this never eats them.
const REGION_PREFIX = /^[A-Z]{2,5}\d?-/;

// Checked in order — put more-specific patterns before generic ones
// (Tier2-HTTPS must beat Tier2).
const PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [/^Requests-Tier2-HTTPS/, "HTTPS requests"],
  [/^Requests-Tier1/, "PUT/COPY/POST/LIST requests"],
  [/^Requests-Tier2/, "GET requests"],
  [/^TimedStorage-ByteHrs/, "Storage"],
  [/^DataTransfer-Out-Bytes/, "Data transfer out"],
  [/^DataTransfer-In-Bytes/, "Data transfer in"],
  [/^Lambda-GB-Second/, "Compute (GB-s)"],
  [/^ReadRequestUnits/, "Reads (RRU)"],
  [/^WriteRequestUnits/, "Writes (WRU)"],
];

export function prettyUsageType(raw: string): string {
  const stripped = raw.replace(REGION_PREFIX, "");
  for (const [pattern, label] of PATTERNS) {
    if (pattern.test(stripped)) return label;
  }
  return stripped;
}
