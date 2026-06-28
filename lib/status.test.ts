import { describe, it, expect } from "vitest";
import {
  computeEffectiveStatus,
  daysUntilRenewal,
  isWithinDays,
  isExpiringSoon,
  isUrgent,
  suggestNextRenewal,
} from "@/lib/status";

// Fixed reference point so tests never depend on the wall clock.
const NOW = new Date("2026-06-26T12:00:00");

function inDays(days: number, hour = 9): Date {
  const d = new Date("2026-06-26T00:00:00");
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

describe("daysUntilRenewal", () => {
  it("returns 0 for the same calendar day regardless of time", () => {
    expect(daysUntilRenewal(inDays(0, 1), NOW)).toBe(0);
    expect(daysUntilRenewal(inDays(0, 23), NOW)).toBe(0);
  });

  it("counts whole days forward and backward", () => {
    expect(daysUntilRenewal(inDays(1), NOW)).toBe(1);
    expect(daysUntilRenewal(inDays(30), NOW)).toBe(30);
    expect(daysUntilRenewal(inDays(-1), NOW)).toBe(-1);
    expect(daysUntilRenewal(inDays(-40), NOW)).toBe(-40);
  });

  it("floors partial days to local midnight (no off-by-one from time of day)", () => {
    const lateNow = new Date("2026-06-26T23:30:00");
    expect(daysUntilRenewal(inDays(1, 0), lateNow)).toBe(1);
  });
});

describe("isWithinDays", () => {
  it("returns false for a null date", () => {
    expect(isWithinDays(null, 30, NOW)).toBe(false);
  });

  it("includes the boundaries [0, n]", () => {
    expect(isWithinDays(inDays(0), 30, NOW)).toBe(true);
    expect(isWithinDays(inDays(30), 30, NOW)).toBe(true);
  });

  it("excludes dates beyond n and dates already past", () => {
    expect(isWithinDays(inDays(31), 30, NOW)).toBe(false);
    expect(isWithinDays(inDays(-1), 30, NOW)).toBe(false);
  });
});

describe("computeEffectiveStatus", () => {
  describe("cancelled always wins", () => {
    it("stays cancelled regardless of renewal date", () => {
      expect(computeEffectiveStatus("cancelled", inDays(-100), NOW)).toBe("cancelled");
      expect(computeEffectiveStatus("cancelled", inDays(5), NOW)).toBe("cancelled");
      expect(computeEffectiveStatus("cancelled", inDays(500), NOW)).toBe("cancelled");
      expect(computeEffectiveStatus("cancelled", null, NOW)).toBe("cancelled");
    });
  });

  describe("null renewal date keeps the manual status", () => {
    it.each(["active", "expired"] as const)(
      "%s with no date is unchanged",
      (status) => {
        expect(computeEffectiveStatus(status, null, NOW)).toBe(status);
      },
    );
  });

  describe("lifecycle is only active / expired / cancelled", () => {
    it("active with a renewal soon stays active (not a separate bucket)", () => {
      expect(computeEffectiveStatus("active", inDays(30), NOW)).toBe("active");
      expect(computeEffectiveStatus("active", inDays(7), NOW)).toBe("active");
      expect(computeEffectiveStatus("active", inDays(0), NOW)).toBe("active");
    });

    it("active with a past-due date becomes expired", () => {
      expect(computeEffectiveStatus("active", inDays(-1), NOW)).toBe("expired");
    });

    it("active with a far-future date stays active", () => {
      expect(computeEffectiveStatus("active", inDays(31), NOW)).toBe("active");
      expect(computeEffectiveStatus("active", inDays(365), NOW)).toBe("active");
    });

    it("manual expired stays expired even with a future date", () => {
      expect(computeEffectiveStatus("expired", inDays(90), NOW)).toBe("expired");
      expect(computeEffectiveStatus("expired", inDays(5), NOW)).toBe("expired");
    });
  });
});

describe("isExpiringSoon (derived flag over active rows)", () => {
  it("is true for active rows within the threshold (inclusive)", () => {
    expect(isExpiringSoon("active", inDays(0), 30, NOW)).toBe(true);
    expect(isExpiringSoon("active", inDays(30), 30, NOW)).toBe(true);
  });

  it("is false beyond the threshold", () => {
    expect(isExpiringSoon("active", inDays(31), 30, NOW)).toBe(false);
  });

  it("respects a custom threshold", () => {
    expect(isExpiringSoon("active", inDays(45), 60, NOW)).toBe(true);
    expect(isExpiringSoon("active", inDays(45), 30, NOW)).toBe(false);
  });

  it("is false for expired or cancelled rows", () => {
    expect(isExpiringSoon("expired", inDays(5), 30, NOW)).toBe(false);
    expect(isExpiringSoon("cancelled", inDays(5), 30, NOW)).toBe(false);
  });

  it("is false with no renewal date", () => {
    expect(isExpiringSoon("active", null, 30, NOW)).toBe(false);
  });
});

describe("isUrgent (tighter band inside expiring soon)", () => {
  it("is true within the urgent window", () => {
    expect(isUrgent("active", inDays(7), 7, NOW)).toBe(true);
    expect(isUrgent("active", inDays(0), 7, NOW)).toBe(true);
  });

  it("is false beyond the urgent window", () => {
    expect(isUrgent("active", inDays(8), 7, NOW)).toBe(false);
  });

  it("is false for non-active rows", () => {
    expect(isUrgent("expired", inDays(3), 7, NOW)).toBe(false);
  });
});

describe("suggestNextRenewal", () => {
  it("future renewal date → adds 1 month to that date", () => {
    const renewal = new Date("2026-07-15");
    expect(suggestNextRenewal(renewal, NOW).toISOString().slice(0, 10)).toBe("2026-08-15");
  });

  it("past renewal date → adds 1 month to today", () => {
    const renewal = new Date("2026-05-01");
    expect(suggestNextRenewal(renewal, NOW).toISOString().slice(0, 10)).toBe("2026-07-26");
  });

  it("null renewal date → adds 1 month to today", () => {
    expect(suggestNextRenewal(null, NOW).toISOString().slice(0, 10)).toBe("2026-07-26");
  });

  it("renewal exactly today (0 days) → adds 1 month to today", () => {
    expect(suggestNextRenewal(NOW, NOW).toISOString().slice(0, 10)).toBe("2026-07-26");
  });
});
