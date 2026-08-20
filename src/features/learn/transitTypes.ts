/**
 * Shared geometry/layout types for the transit-map learn view.
 *
 * `buildLayout` (TransitLearnPage) produces a `Layout`; both the horizontal
 * `NetworkMap` (desktop) and the vertical `VerticalNetworkMap` (mobile) consume
 * it. The types live here — not inside either consumer — so the two renderers
 * share one shape and neither has to import the other.
 */
import type { CourseModule, SideQuest } from "@/shared/domain/course";
import type { ModuleStatus } from "@/features/learn/moduleProgress";
import type { QuestLeg } from "@/features/learn/components/DistrictView";

export type Pt = readonly [number, number];

export type StationL = {
  x: number;
  y: number;
  labelSide: "top" | "bottom";
  index: number;
  module: CourseModule;
  badge: string;
  isReview: boolean;
  status: ModuleStatus;
  done: number;
  total: number;
  interchange: boolean;
  terminal: boolean;
};

export type QuestStop = { x: number; y: number; quest: SideQuest; leg?: QuestLeg; labelDy?: number };

export type SpurL = {
  color: string;
  d: string;
  dashed: boolean;
  stops: QuestStop[];
  label: string;
  labelX: number;
  labelY: number; // plate center
  up: boolean;
  cap: Pt | null;
  capDir: "v" | "h";
};

export type DepotL = { d: string; tracks: Pt[][]; labelX: number; labelY: number };

export type Zone = { x0: number; x1: number; label: string; numeral: string };

export type Layout = {
  width: number;
  vbY: number;
  vbH: number;
  skyGroundY: number;
  mainPts: Pt[];
  stations: StationL[];
  spurs: SpurL[];
  depot: DepotL | null;
  zones: Zone[];
  zoneChipY: number;
  /** stations where a branch vertical enters/leaves (and on which side) —
   * labels shift aside when the vertical would pierce them */
  branchTouched: ReadonlyMap<number, "up" | "down">;
};
