"use client";

import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { formatDate, formatIDR } from "@/lib/types";
import type { SerializedRenewal } from "@/lib/serialize";

function RenewalRow({ entry }: { entry: SerializedRenewal }) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <History className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="font-mono text-xs tabular-nums">
            {formatDate(entry.previousRenewalDate)} → {formatDate(entry.newRenewalDate)}
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="tabular-nums text-muted-foreground">
            {formatIDR(entry.costSnapshot)}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Renewed{" "}
          {new Date(entry.renewedAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>
    </li>
  );
}

export function RenewalHistoryList({ subscriptionId }: { subscriptionId: number }) {
  const { data, isLoading } = useQuery<SerializedRenewal[]>({
    queryKey: ["subscription", subscriptionId, "renewals"],
    queryFn: async () => {
      const res = await fetch(`/api/subscriptions/${subscriptionId}/renewals`);
      if (!res.ok) throw new Error("Failed to load renewal history");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-9 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">No renewal history yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {data.map((entry) => (
        <RenewalRow key={entry.id} entry={entry} />
      ))}
    </ul>
  );
}
