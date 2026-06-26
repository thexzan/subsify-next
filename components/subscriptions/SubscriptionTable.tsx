"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
import { StatusBadge } from "./StatusBadge";
import { formatDate, formatIDR, type Subscription } from "@/lib/types";
import { SUB_STATUS_VALUES } from "@/lib/validation";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  expiring_soon: "Expiring soon",
  expired: "Expired",
  cancelled: "Cancelled",
};

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  return Math.floor((target.getTime() - today.getTime()) / 86_400_000);
}

function rowHighlight(sub: Subscription): string {
  if (sub.effectiveStatus === "cancelled") return "";
  const days = daysUntil(sub.renewalDate);
  if (days === null || days < 0) return "";
  if (days <= 7) return "bg-hot/5";
  if (days <= 30) return "bg-warn/5";
  return "";
}

export function SubscriptionTable({
  rows,
  onEdit,
}: {
  rows: Subscription[];
  onEdit: (sub: Subscription) => void;
}) {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Subscription | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    queryClient.invalidateQueries({ queryKey: ["stats"] });
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

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Tool</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Renewal</TableHead>
              <TableHead className="text-right">Monthly cost</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((sub) => (
              <TableRow key={sub.id} className={cn(rowHighlight(sub))}>
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
                  <StatusBadge status={sub.effectiveStatus} />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(sub)}>
                        <Pencil className="h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-muted-foreground">
                        Set status
                      </DropdownMenuLabel>
                      {SUB_STATUS_VALUES.map((s) => (
                        <DropdownMenuItem
                          key={s}
                          disabled={s === sub.status}
                          onClick={() =>
                            statusMutation.mutate({ sub, status: s })
                          }
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
    </>
  );
}
