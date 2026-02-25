import { useTheme } from "@/shared/contexts/ThemeContext";
import { Icon } from "@/shared/components/Icon";

export function ThemeToggle() {
  const { openThemeEditor } = useTheme();

  return (
    <button
      type="button"
      onClick={openThemeEditor}
      className="rounded-full p-1.5 text-text-muted transition hover:bg-surface-muted hover:text-text-primary sm:p-2"
      aria-label="Open theme editor"
    >
      <Icon name="palette" size={20} />
    </button>
  );
}
