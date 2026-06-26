"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RenewalRadar } from "@/components/dashboard/RenewalRadar";
import { ExpiringList } from "@/components/dashboard/ExpiringList";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ErrorState";
import { useSubscriptionModal } from "@/components/subscriptions/SubscriptionModalProvider";
import { formatIDR, type Stats, type Subscription } from "@/lib/types";

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

export default function DashboardPage() {
  const { openAdd } = useSubscriptionModal();
  const statsQuery = useQuery({
    queryKey: ["stats"],
    queryFn: () => fetchJSON<Stats>("/api/stats"),
  });
  const subsQuery = useQuery({
    queryKey: ["subscriptions", {}],
    queryFn: () => fetchJSON<Subscription[]>("/api/subscriptions"),
  });

  const stats = statsQuery.data;

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of your subscriptions and what needs attention.
          </p>
        </div>
        <Button size="sm" className="hidden lg:inline-flex" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add subscription
        </Button>
      </header>

      {statsQuery.isError || subsQuery.isError ? (
        <ErrorState
          onRetry={() => {
            statsQuery.refetch();
            subsQuery.refetch();
          }}
        />
      ) : (
        <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statsQuery.isLoading || !stats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[104px] rounded-xl" />
          ))
        ) : (
          <>
            <StatsCard label="Total" value={stats.total} tone="neutral" />
            <StatsCard label="Active" value={stats.active} tone="calm" />
            <StatsCard
              label="Expiring soon"
              value={stats.expiring_soon}
              tone="warn"
            />
            <StatsCard label="Expired" value={stats.expired} tone="hot" />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Monthly spend
          </p>
          {statsQuery.isLoading || !stats ? (
            <Skeleton className="mt-3 h-9 w-40" />
          ) : (
            <p className="tabular mt-2 text-3xl font-semibold tracking-tight">
              {formatIDR(stats.total_monthly_cost)}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Active and expiring subscriptions
          </p>
        </div>

        <div className="lg:col-span-2">
          {subsQuery.isLoading ? (
            <Skeleton className="h-[200px] rounded-xl" />
          ) : (
            <RenewalRadar subscriptions={subsQuery.data ?? []} />
          )}
        </div>
      </div>

      {subsQuery.isLoading ? (
        <Skeleton className="h-[200px] rounded-xl" />
      ) : (
        <ExpiringList subscriptions={subsQuery.data ?? []} />
      )}
        </>
      )}
    </div>
  );
}
