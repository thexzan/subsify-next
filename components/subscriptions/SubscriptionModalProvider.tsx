"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { SubscriptionModal } from "./SubscriptionModal";
import type { Subscription } from "@/lib/types";

type SubscriptionModalContextValue = {
  openAdd: () => void;
  openEdit: (sub: Subscription) => void;
};

const SubscriptionModalContext =
  createContext<SubscriptionModalContextValue | null>(null);

export function useSubscriptionModal(): SubscriptionModalContextValue {
  const ctx = useContext(SubscriptionModalContext);
  if (!ctx) {
    throw new Error(
      "useSubscriptionModal must be used within a SubscriptionModalProvider",
    );
  }
  return ctx;
}

export function SubscriptionModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);

  // Departments power the form's combobox; fetched here so the modal works from
  // any page (dashboard included), not just the subscriptions list.
  const { data } = useQuery({
    queryKey: ["subscriptions", "all-departments"],
    queryFn: async () => {
      const res = await fetch("/api/subscriptions");
      if (!res.ok) throw new Error("Failed to load");
      return res.json() as Promise<Subscription[]>;
    },
    staleTime: 60_000,
  });

  const departments = useMemo(() => {
    const set = new Set((data ?? []).map((s) => s.department));
    return Array.from(set).sort();
  }, [data]);

  const value = useMemo<SubscriptionModalContextValue>(
    () => ({
      openAdd: () => {
        setEditing(null);
        setOpen(true);
      },
      openEdit: (sub: Subscription) => {
        setEditing(sub);
        setOpen(true);
      },
    }),
    [],
  );

  return (
    <SubscriptionModalContext.Provider value={value}>
      {children}
      <SubscriptionModal
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        departments={departments}
      />
    </SubscriptionModalContext.Provider>
  );
}
