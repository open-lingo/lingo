import type { SVGProps } from "react";
import { iconRegistry, type IconName } from "@/shared/iconRegistry";

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
  fill?: string;
} & Omit<SVGProps<SVGSVGElement>, "color">;

export function Icon({
  name,
  size = 20,
  color,
  className,
  strokeWidth,
  fill,
  ...rest
}: Props) {
  const Component = iconRegistry[name];
  if (!Component) return null;

  const componentProps = {
    size,
    color,
    strokeWidth,
    ...(fill !== undefined && { fill }), // only pass fill when set; omit so Lucide default (none) is used
    className,
    ...rest,
  };

  return <Component {...componentProps} />;
}
