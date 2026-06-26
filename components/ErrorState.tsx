import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({
  message = "Something went wrong while loading this data.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-12 text-center">
      <AlertTriangle className="h-6 w-6 text-hot" />
      <p className="mt-3 text-sm font-medium">Couldn&apos;t load data</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
