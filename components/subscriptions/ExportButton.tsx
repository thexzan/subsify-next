"use client";

import Papa from "papaparse";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Subscription } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  expiring_soon: "Expiring Soon",
  expired: "Expired",
  cancelled: "Cancelled",
};

export function ExportButton({ rows }: { rows: Subscription[] }) {
  function handleExport() {
    const data = rows.map((s) => ({
      "Tool Name": s.toolName,
      Department: s.department,
      "Renewal Date": s.renewalDate ?? "",
      "Monthly Cost": s.monthlyCost,
      Status: STATUS_LABEL[s.effectiveStatus] ?? s.effectiveStatus,
      Notes: s.notes ?? "",
    }));

    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `subsify-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={rows.length === 0}
      title={rows.length === 0 ? "No subscriptions to export" : undefined}
    >
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  );
}
