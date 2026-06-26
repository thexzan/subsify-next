"use client";

import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { useSubscriptionModal } from "./SubscriptionModalProvider";

// Pages where adding a subscription makes sense from the thumb zone.
const FAB_ROUTES = new Set(["/", "/subscriptions"]);

export function QuickAddFab() {
  const pathname = usePathname();
  const { openAdd } = useSubscriptionModal();

  if (!FAB_ROUTES.has(pathname)) return null;

  return (
    <button
      type="button"
      onClick={openAdd}
      aria-label="Add subscription"
      className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95 lg:hidden"
    >
      <Plus className="h-6 w-6" />
    </button>
  );
}
