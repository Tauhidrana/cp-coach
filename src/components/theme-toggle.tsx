import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemeMode } from "./theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { mode, resolved, setMode } = useTheme();
  const Icon = resolved === "light" ? Sun : Moon;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? "icon" : "icon"}
          aria-label="Toggle theme"
          className="relative"
        >
          <Icon className="size-4 transition-transform duration-300" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-strong border-border/60">
        {(["light", "dark", "system"] as ThemeMode[]).map((m) => {
          const IconM = m === "light" ? Sun : m === "dark" ? Moon : Monitor;
          return (
            <DropdownMenuItem
              key={m}
              onClick={() => setMode(m)}
              className={`gap-2 ${mode === m ? "text-primary" : ""}`}
            >
              <IconM className="size-4" />
              <span className="capitalize">{m}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
