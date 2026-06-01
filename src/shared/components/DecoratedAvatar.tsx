import { UserAvatar, type UserAvatarProps } from "./UserAvatar";
import type { DecoratorStyle } from "@/features/shop/decoratorStyles";
import { cn } from "@/shared/components/ui/cn";

export type DecoratedAvatarProps = UserAvatarProps & {
  /** When provided, renders a gradient ring around the avatar. */
  decoratorStyle?: DecoratorStyle | null;
  /** Extra wrapper class (applies to the ring container when a decorator is shown). */
  wrapperClassName?: string;
};

/**
 * UserAvatar with optional purchasable frame ring.
 *
 * Ring sizing: the ring is 3px thick with a 2px transparent gap between ring
 * and image (achieved with bg-surface fill layer). This approach works on any
 * background without extra box-shadow hacks.
 */
export function DecoratedAvatar({
  decoratorStyle,
  wrapperClassName,
  ...avatarProps
}: DecoratedAvatarProps) {
  if (!decoratorStyle) {
    return <UserAvatar {...avatarProps} />;
  }

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full p-[3px]",
        wrapperClassName,
      )}
      style={{ background: decoratorStyle.background }}
      role="presentation"
      aria-label={decoratorStyle.label}
    >
      <div className="rounded-full bg-surface p-[2px]">
        <UserAvatar {...avatarProps} />
      </div>
    </div>
  );
}
