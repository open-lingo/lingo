import { getDecoratorStyle, type DecoratorStyle } from "./decoratorStyles";
import { useEquippedCosmetic } from "./useEquippedCosmetic";

/**
 * Reads and writes the user's equipped avatar decorator.
 *
 * Equipped decorator id is stored at `settings.shop.equippedDecorator`.
 * Callers get the style object (CSS gradient + label) directly so they
 * never need to import decoratorStyles themselves.
 */
export function useEquippedDecorator() {
  const base = useEquippedCosmetic("equippedDecorator");
  const style: DecoratorStyle | null = getDecoratorStyle(base.equippedId);
  return { ...base, style };
}
