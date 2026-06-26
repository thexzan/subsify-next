"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SubscriptionTable } from "@/components/subscriptions/SubscriptionTable";
import { StatusTabs, type StatusFilter } from "@/components/subscriptions/StatusTabs";
import { useSubscriptionModal } from "@/components/subscriptions/SubscriptionModalProvider";
import { ExportButton } from "@/components/subscriptions/ExportButton";
import { ErrorState } from "@/components/ErrorState";
import type { Subscription } from "@/lib/types";

function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SubscriptionsPage() {
  const { openAdd, openEdit } = useSubscriptionModal();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [department, setDepartment] = useState<string>("all");

  const debouncedSearch = useDebounced(search);

  // Departments come from the full dataset, so the dropdown is stable
  // regardless of active filters.
  const allQuery = useQuery({
    queryKey: ["subscriptions", "all-departments"],
    queryFn: async () => {
      const res = await fetch("/api/subscriptions");
      if (!res.ok) throw new Error("Failed to load");
      return res.json() as Promise<Subscription[]>;
    },
  });

  const departments = useMemo(() => {
    const set = new Set((allQuery.data ?? []).map((s) => s.department));
    return Array.from(set).sort();
  }, [allQuery.data]);

  const filters = {
    search: debouncedSearch,
    status,
    department,
  };

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["subscriptions", filters],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (status !== "all") params.set("status", status);
      if (department !== "all") params.set("department", department);
      const res = await fetch(`/api/subscriptions?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json() as Promise<Subscription[]>;
    },
  });

  const rows = data ?? [];
  const hasFilters =
    debouncedSearch !== "" || status !== "all" || department !== "all";

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Subscriptions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage all tracked tools and their renewals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton rows={rows} />
          <Button size="sm" className="hidden lg:inline-flex" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add subscription
          </Button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tool or department…"
              className="h-11 pl-9 sm:h-10"
            />
          </div>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="h-11 sm:h-10 sm:w-44">
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <StatusTabs value={status} onChange={setStatus} />
      </div>

      {/* Content */}
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          hasFilters={hasFilters}
          onAdd={openAdd}
          onClearFilters={() => {
            setSearch("");
            setStatus("all");
            setDepartment("all");
          }}
        />
      ) : (
        <div className={isFetching ? "opacity-70 transition-opacity" : ""}>
          <SubscriptionTable rows={rows} onEdit={openEdit} />
        </div>
      )}
    </div>
  );
}

function EmptyState({
  hasFilters,
  onAdd,
  onClearFilters,
}: {
  hasFilters: boolean;
  onAdd: () => void;
  onClearFilters: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
      <p className="text-sm font-medium">
        {hasFilters ? "No subscriptions match your filters" : "No subscriptions yet"}
      </p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        {hasFilters
          ? "Try adjusting your search or filters."
          : "Add your first tool to start tracking renewals."}
      </p>
      {hasFilters ? (
        <Button variant="outline" size="sm" className="mt-4" onClick={onClearFilters}>
          Clear filters
        </Button>
      ) : (
        <Button size="sm" className="mt-4" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Add subscription
        </Button>
      )}
    </div>
  );
}
