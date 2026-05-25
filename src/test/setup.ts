import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Reset @testing-library/react's mounted containers between tests so
// `screen.getByRole` and friends don't trip over portals or repeated
// mounts from prior tests (10 UI component tests were failing on this
// before — Switch/Pagination/Modal/Sheet/Dialog/Accordion/SegmentedControl).
afterEach(() => {
  cleanup();
});
