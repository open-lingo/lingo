/**
 * The signed-in Home surface — "One Thing, with a way out."
 *
 * Thin wrapper: pulls the live home data and renders the redesign, injecting
 * the already-sanitized greeting name from HomePage. Kept here alongside the
 * design + data hook; promote out of `variants/` when the i18n pass lands.
 */
import { useHomeVariantData } from "./useHomeVariantData";
import { HomeVariant1 } from "./HomeVariant1";

export function HomeMain({ greetingName }: { greetingName: string }) {
  const data = useHomeVariantData();
  return <HomeVariant1 data={{ ...data, name: greetingName }} />;
}
