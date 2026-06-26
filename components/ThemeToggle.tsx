"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const ORDER = ["light", "dark", "system"] as const;
type Mode = (typeof ORDER)[number];

const META: Record<Mode, { icon: typeof Sun; label: string }> = {
  light: { icon: Sun, label: "Light" },
  dark: { icon: Moon, label: "Dark" },
  system: { icon: Monitor, label: "System" },
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Avoid a hydration mismatch: render a stable placeholder until mounted.
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-3 text-muted-foreground"
        disabled
      >
        <Monitor className="h-4 w-4" />
        Theme
      </Button>
    );
  }

  const current = (theme as Mode) ?? "system";
  const { icon: Icon, label } = META[current] ?? META.system;

  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
    setTheme(next);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start gap-3 text-muted-foreground"
      onClick={cycle}
      title={`Theme: ${label} (click to change)`}
    >
      <Icon className="h-4 w-4" />
      Theme: {label}
    </Button>
  );
}
