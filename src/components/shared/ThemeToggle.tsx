import { Moon, Sun } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  const { theme, toggleTheme } = useUIStore();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-full transition-colors",
        inverted
          ? "text-slate-300 hover:bg-white/10 hover:text-white"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}
