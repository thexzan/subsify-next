import { cn } from "@/lib/utils";

type Tone = "neutral" | "calm" | "warn" | "hot";

const RAIL: Record<Tone, string> = {
  neutral: "bg-muted-foreground",
  calm: "bg-calm",
  warn: "bg-warn",
  hot: "bg-hot",
};

const GLOW: Record<Tone, string> = {
  neutral: "",
  calm: "",
  warn: "shadow-[0_0_24px_-8px_var(--warn)]",
  hot: "shadow-[0_0_24px_-8px_var(--hot)]",
};

export function StatsCard({
  label,
  value,
  tone = "neutral",
  hint,
  alert = false,
}: {
  label: string;
  value: string | number;
  tone?: Tone;
  hint?: string;
  alert?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card p-5",
        alert && GLOW[tone],
      )}
    >
      <span className={cn("absolute left-0 top-0 h-full w-[3px]", RAIL[tone])} />
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="tabular mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
