// Shared hooks (useStorage, useSync, etc. when storage DI is added)
export { useUserStats } from "./useUserStats";
export type { UserStats } from "./useUserStats";
export { useTouchOnSession } from "./useTouchOnSession";

// Viewport / responsive
export { useMediaQuery } from "./useMediaQuery";
export { useViewport, useBreakpoint, BREAKPOINTS, type Breakpoint, type Viewport } from "./useViewport";

// A11y / interaction
export { useFocusTrap } from "./useFocusTrap";
export { useEscapeKey } from "./useEscapeKey";
