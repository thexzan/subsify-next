import { describe, it, expect } from "vitest";
import { filterSubscriptions, computeStats } from "@/lib/subscriptions";
import type { SerializedSubscription } from "@/lib/serialize";

function sub(
  over: Partial<SerializedSubscription> & Pick<SerializedSubscription, "id">,
): SerializedSubscription {
  return {
    id: over.id,
    toolName: over.toolName ?? "Tool",
    department: over.department ?? "Engineering",
    renewalDate: over.renewalDate ?? null,
    monthlyCost: over.monthlyCost ?? 100000,
    status: over.status ?? "active",
    effectiveStatus: over.effectiveStatus ?? over.status ?? "active",
    notes: over.notes ?? null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

const ROWS: SerializedSubscription[] = [
  sub({ id: 1, toolName: "Notion", department: "Engineering", effectiveStatus: "expiring_soon", monthlyCost: 160000 }),
  sub({ id: 2, toolName: "Figma", department: "Design", effectiveStatus: "active", monthlyCost: 225000 }),
  sub({ id: 3, toolName: "Slack", department: "All", effectiveStatus: "expired", monthlyCost: 500000 }),
  sub({ id: 4, toolName: "Adobe CC", department: "Design", effectiveStatus: "expired", monthlyCost: 350000 }),
  sub({ id: 5, toolName: "HubSpot", department: "Marketing", effectiveStatus: "cancelled", monthlyCost: 1500000 }),
  sub({ id: 6, toolName: "Loom", department: "All", effectiveStatus: "active", monthlyCost: 120000 }),
];

describe("filterSubscriptions", () => {
  it("returns all rows when no filters are given", () => {
    expect(filterSubscriptions(ROWS, {})).toHaveLength(6);
  });

  it("filters by effective status", () => {
    const expired = filterSubscriptions(ROWS, { status: "expired" });
    expect(expired.map((s) => s.toolName).sort()).toEqual(["Adobe CC", "Slack"]);
  });

  it("ignores an invalid status value (no filtering applied)", () => {
    expect(filterSubscriptions(ROWS, { status: "bogus" })).toHaveLength(6);
  });

  it("ignores the 'all' sentinel as an invalid status", () => {
    expect(filterSubscriptions(ROWS, { status: "all" })).toHaveLength(6);
  });

  it("filters by exact department", () => {
    const design = filterSubscriptions(ROWS, { department: "Design" });
    expect(design.map((s) => s.toolName).sort()).toEqual(["Adobe CC", "Figma"]);
  });

  it("searches tool name case-insensitively", () => {
    expect(filterSubscriptions(ROWS, { search: "FIG" }).map((s) => s.toolName)).toEqual([
      "Figma",
    ]);
  });

  it("searches department too", () => {
    expect(
      filterSubscriptions(ROWS, { search: "marketing" }).map((s) => s.toolName),
    ).toEqual(["HubSpot"]);
  });

  it("combines status and department filters (AND)", () => {
    const r = filterSubscriptions(ROWS, { status: "expired", department: "Design" });
    expect(r.map((s) => s.toolName)).toEqual(["Adobe CC"]);
  });

  it("returns empty when nothing matches", () => {
    expect(filterSubscriptions(ROWS, { search: "nonexistent" })).toEqual([]);
  });
});

describe("computeStats", () => {
  it("counts by effective status and they sum to total (no double-count)", () => {
    const s = computeStats(ROWS);
    expect(s.total).toBe(6);
    expect(s.active).toBe(2);
    expect(s.expiring_soon).toBe(1);
    expect(s.expired).toBe(2);
    expect(s.cancelled).toBe(1);
    expect(s.active + s.expiring_soon + s.expired + s.cancelled).toBe(s.total);
  });

  it("includes only active + expiring_soon in total monthly cost", () => {
    // 225000 + 120000 (active) + 160000 (expiring_soon) = 505000
    // excludes expired (Slack, Adobe) and cancelled (HubSpot)
    expect(computeStats(ROWS).total_monthly_cost).toBe(505000);
  });

  it("handles an empty dataset", () => {
    const s = computeStats([]);
    expect(s).toEqual({
      total: 0,
      active: 0,
      expiring_soon: 0,
      expired: 0,
      cancelled: 0,
      total_monthly_cost: 0,
    });
  });
});
