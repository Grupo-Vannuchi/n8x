import {
  Instagram,
  Palette,
  Camera,
  Megaphone,
  TrendingUp,
  Target,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

/**
 * Maps the icon names stored on `Service.icon` to lucide components. Add new
 * entries here when introducing services with new icons; unknown names fall
 * back to a neutral sparkle.
 */
const icons: Record<string, LucideIcon> = {
  Instagram,
  Palette,
  Camera,
  Megaphone,
  TrendingUp,
  Target,
};

export function Icon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Component = icons[name] ?? Sparkles;
  return <Component className={className} aria-hidden />;
}
