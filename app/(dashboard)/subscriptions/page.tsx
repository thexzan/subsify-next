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
import { SubscriptionModal } from "@/components/subscriptions/SubscriptionModal";
import { ExportButton } from "@/components/subscriptions/ExportButton";
import type { Subscription } from "@/lib/types";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "expiring_soon", label: "Expiring soon" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
] as const;

function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SubscriptionsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [department, setDepartment] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);

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

  const { data, isLoading, isFetching } = useQuery({
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

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(sub: Subscription) {
    setEditing(sub);
    setModalOpen(true);
  }

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
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add subscription
          </Button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tool or department…"
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger className="sm:w-44">
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

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState hasFilters={hasFilters} onAdd={openAdd} />
      ) : (
        <div className={isFetching ? "opacity-70 transition-opacity" : ""}>
          <SubscriptionTable rows={rows} onEdit={openEdit} />
        </div>
      )}

      <SubscriptionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editing={editing}
        departments={departments}
      />
    </div>
  );
}

function EmptyState({
  hasFilters,
  onAdd,
}: {
  hasFilters: boolean;
  onAdd: () => void;
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
      {!hasFilters && (
        <Button size="sm" className="mt-4" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Add subscription
        </Button>
      )}
    </div>
  );
}
