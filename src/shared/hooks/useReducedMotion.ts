import { useSettings } from "@/shared/contexts/SettingsContext";

export function useReducedMotion(): boolean {
  return useSettings().settings.accessibility.reducedMotion;
}
