"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  CalendarCheck,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge, UrgencyBadge } from "./StatusBadge";
import { isRowExpiringSoon } from "@/lib/subscriptions";
import { formatDate, formatIDR, type Subscription } from "@/lib/types";
import { SUB_STATUS_VALUES } from "@/lib/validation";
import { usePreferences } from "@/lib/hooks/use-preferences";
import { useRenewSubscription } from "@/lib/hooks/use-renew-subscription";
import { cn } from "@/lib/utils";
import { suggestNextRenewal } from "@/lib/status";

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  expired: "Expired",
  cancelled: "Cancelled",
};

/**
 * Tailwind background tint for a row/card based on renewal urgency, using the
 * user's configured thresholds. Returns "" when there's nothing to flag.
 */
function highlightFor(
  sub: Subscription,
  expiring: number,
  urgent: number,
): string {
  if (sub.effectiveStatus !== "active") return "";
  const days = sub.daysUntilRenewal;
  if (days === null || days < 0) return "";
  if (days <= urgent) return "bg-hot/5";
  if (days <= expiring) return "bg-warn/5";
  return "";
}

type SortKey =
  | "toolName"
  | "department"
  | "renewalDate"
  | "monthlyCost"
  | "effectiveStatus";
type SortDir = "asc" | "desc";

const STATUS_ORDER: Record<string, number> = {
  expired: 0,
  active: 1,
  cancelled: 2,
};

function compareRows(a: Subscription, b: Subscription, key: SortKey): number {
  switch (key) {
    case "monthlyCost":
      return a.monthlyCost - b.monthlyCost;
    case "renewalDate": {
      const av = a.renewalDate ? new Date(a.renewalDate).getTime() : Infinity;
      const bv = b.renewalDate ? new Date(b.renewalDate).getTime() : Infinity;
      return av - bv;
    }
    case "effectiveStatus":
      return STATUS_ORDER[a.effectiveStatus] - STATUS_ORDER[b.effectiveStatus];
    default:
      return a[key].localeCompare(b[key]);
  }
}

export function SubscriptionTable({
  rows,
  onEdit,
}: {
  rows: Subscription[];
  onEdit: (sub: Subscription) => void;
}) {
  const queryClient = useQueryClient();
  const { expiringThresholdDays, urgentThresholdDays } = usePreferences();
  const [deleteTarget, setDeleteTarget] = useState<Subscription | null>(null);
  const [renewTarget, setRenewTarget] = useState<Subscription | null>(null);
  const [renewDate, setRenewDate] = useState<string>("");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir } | null>(null);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const sorted = [...rows].sort((a, b) => compareRows(a, b, sort.key));
    return sort.dir === "asc" ? sorted : sorted.reverse();
  }, [rows, sort]);

  const toggleSort = (key: SortKey) => {
    setSort((prev) =>
      prev?.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    queryClient.invalidateQueries({ queryKey: ["stats"] });
  };

  const openRenew = (sub: Subscription) => {
    const suggested = suggestNextRenewal(
      sub.renewalDate ? new Date(sub.renewalDate) : null,
    );
    setRenewDate(suggested.toISOString().slice(0, 10));
    setRenewTarget(sub);
  };

  const statusMutation = useMutation({
    mutationFn: async ({ sub, status }: { sub: Subscription; status: string }) => {
      const res = await fetch(`/api/subscriptions/${sub.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolName: sub.toolName,
          department: sub.department,
          renewalDate: sub.renewalDate,
          monthlyCost: sub.monthlyCost,
          status,
          notes: sub.notes,
        }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      toast.success("Status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (sub: Subscription) => {
      const res = await fetch(`/api/subscriptions/${sub.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      invalidate();
      toast.success("Subscription deleted");
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { renew, isPending: isRenewing } = useRenewSubscription({
    onSuccess: () => setRenewTarget(null),
  });

  const renderActions = (sub: Subscription, triggerClass?: string) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-11 w-11 lg:h-8 lg:w-8", triggerClass)}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuItem onClick={() => onEdit(sub)}>
          <Pencil className="h-4 w-4" />
          Edit
        </DropdownMenuItem>
        {sub.effectiveStatus !== "cancelled" && sub.renewalDate && (
          <DropdownMenuItem onClick={() => openRenew(sub)}>
            <CalendarCheck className="h-4 w-4" />
            Mark as renewed
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Set status
        </DropdownMenuLabel>
        {SUB_STATUS_VALUES.map((s) => (
          <DropdownMenuItem
            key={s}
            disabled={s === sub.status}
            onClick={() => statusMutation.mutate({ sub, status: s })}
          >
            {STATUS_LABELS[s]}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => setDeleteTarget(sub)}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      {/* Desktop: table */}
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-card lg:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <SortableHead label="Tool" sortKey="toolName" sort={sort} onSort={toggleSort} />
              <SortableHead label="Department" sortKey="department" sort={sort} onSort={toggleSort} />
              <SortableHead label="Renewal" sortKey="renewalDate" sort={sort} onSort={toggleSort} />
              <SortableHead label="Monthly cost" sortKey="monthlyCost" sort={sort} onSort={toggleSort} align="right" />
              <SortableHead label="Status" sortKey="effectiveStatus" sort={sort} onSort={toggleSort} />
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRows.map((sub) => (
              <TableRow
                key={sub.id}
                className={cn(highlightFor(sub, expiringThresholdDays, urgentThresholdDays))}
              >
                <TableCell className="font-medium">{sub.toolName}</TableCell>
                <TableCell className="text-muted-foreground">
                  {sub.department}
                </TableCell>
                <TableCell className="tabular font-mono text-sm">
                  {formatDate(sub.renewalDate)}
                </TableCell>
                <TableCell className="tabular text-right">
                  {formatIDR(sub.monthlyCost)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={sub.effectiveStatus} />
                    {isRowExpiringSoon(sub, expiringThresholdDays) && (
                      <UrgencyBadge
                        urgent={
                          sub.daysUntilRenewal !== null &&
                          sub.daysUntilRenewal <= urgentThresholdDays
                        }
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell>{renderActions(sub)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: card list (tap a card to edit; the ⋮ menu has its own area) */}
      <ul className="flex flex-col gap-2 lg:hidden">
        {sortedRows.map((sub) => (
          <li key={sub.id}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => onEdit(sub)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onEdit(sub);
                }
              }}
              className={cn(
                "flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors active:bg-muted/50",
                highlightFor(sub, expiringThresholdDays, urgentThresholdDays),
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{sub.toolName}</span>
                  <StatusBadge status={sub.effectiveStatus} />
                  {isRowExpiringSoon(sub, expiringThresholdDays) && (
                    <UrgencyBadge
                      urgent={
                        sub.daysUntilRenewal !== null &&
                        sub.daysUntilRenewal <= urgentThresholdDays
                      }
                    />
                  )}
                </div>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {sub.department}
                </p>
                <div className="mt-2 flex items-center gap-3 text-sm">
                  <span className="tabular font-medium">
                    {formatIDR(sub.monthlyCost)}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="tabular font-mono text-xs text-muted-foreground">
                    {formatDate(sub.renewalDate)}
                  </span>
                </div>
              </div>
              {renderActions(sub, "-mr-2 shrink-0")}
            </div>
          </li>
        ))}
      </ul>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.toolName}
              </span>
              . This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!renewTarget}
        onOpenChange={(o) => !o && setRenewTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark as renewed</DialogTitle>
            <DialogDescription>
              Set the next renewal date for{" "}
              <span className="font-medium text-foreground">
                {renewTarget?.toolName}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="renew-date">Next renewal date</Label>
            <Input
              id="renew-date"
              type="date"
              value={renewDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setRenewDate(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setRenewTarget(null)}
              disabled={isRenewing}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                renewTarget &&
                renew({ id: renewTarget.id, renewalDate: renewDate })
              }
              disabled={!renewDate || isRenewing}
            >
              {isRenewing ? "Saving…" : "Confirm renewal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SortableHead({
  label,
  sortKey,
  sort,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: SortKey;
  sort: { key: SortKey; dir: SortDir } | null;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sort?.key === sortKey;
  const Icon = !active ? ChevronsUpDown : sort!.dir === "asc" ? ChevronUp : ChevronDown;
  return (
    <TableHead className={align === "right" ? "text-right" : undefined}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 transition-colors hover:text-foreground",
          align === "right" && "flex-row-reverse",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        <Icon className={cn("h-3.5 w-3.5", !active && "opacity-50")} />
      </button>
    </TableHead>
  );
}
