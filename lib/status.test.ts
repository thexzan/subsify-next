import { describe, it, expect } from "vitest";
import {
  computeEffectiveStatus,
  daysUntilRenewal,
  isWithinDays,
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
    it.each(["active", "expiring_soon", "expired"] as const)(
      "%s with no date is unchanged",
      (status) => {
        expect(computeEffectiveStatus(status, null, NOW)).toBe(status);
      },
    );
  });

  describe("date escalates urgency", () => {
    it("active with a past-due date becomes expired", () => {
      expect(computeEffectiveStatus("active", inDays(-1), NOW)).toBe("expired");
    });

    it("active within 30 days becomes expiring_soon", () => {
      expect(computeEffectiveStatus("active", inDays(30), NOW)).toBe("expiring_soon");
      expect(computeEffectiveStatus("active", inDays(7), NOW)).toBe("expiring_soon");
    });

    it("active today (0 days) becomes expiring_soon, not expired", () => {
      expect(computeEffectiveStatus("active", inDays(0), NOW)).toBe("expiring_soon");
    });

    it("expiring_soon (manual) with a past-due date escalates to expired", () => {
      expect(computeEffectiveStatus("expiring_soon", inDays(-1), NOW)).toBe("expired");
    });
  });

  describe("date never lowers urgency", () => {
    it("active with a far-future date stays active", () => {
      expect(computeEffectiveStatus("active", inDays(31), NOW)).toBe("active");
      expect(computeEffectiveStatus("active", inDays(365), NOW)).toBe("active");
    });

    it("manual expiring_soon stays expiring_soon when the date looks calm", () => {
      expect(computeEffectiveStatus("expiring_soon", inDays(90), NOW)).toBe(
        "expiring_soon",
      );
    });

    it("manual expired stays expired even with a future date", () => {
      expect(computeEffectiveStatus("expired", inDays(90), NOW)).toBe("expired");
      expect(computeEffectiveStatus("expired", inDays(5), NOW)).toBe("expired");
    });
  });

  describe("30/31 day boundary", () => {
    it("exactly 30 days is expiring_soon", () => {
      expect(computeEffectiveStatus("active", inDays(30), NOW)).toBe("expiring_soon");
    });

    it("31 days is active", () => {
      expect(computeEffectiveStatus("active", inDays(31), NOW)).toBe("active");
    });
  });
});
