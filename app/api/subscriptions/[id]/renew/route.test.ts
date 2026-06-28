import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/api-auth", () => ({ getAuthUser: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { getAuthUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

function futureDateStr(daysAhead = 30): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

const MOCK_SUB = {
  id: 1,
  toolName: "Notion",
  department: "Engineering",
  renewalDate: new Date(),
  monthlyCost: 160000,
  status: "active",
  notes: null,
  userId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeRequest(id: string, body: unknown) {
  return new Request(`http://localhost/api/subscriptions/${id}/renew`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("POST /api/subscriptions/[id]/renew", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null);
    const res = await POST(makeRequest("1", { renewalDate: futureDateStr() }) as never, ctx("1"));
    expect(res.status).toBe(401);
  });

  it("returns 400 for a non-integer id", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: "1", email: "a@b.com" });
    const res = await POST(makeRequest("abc", { renewalDate: futureDateStr() }) as never, ctx("abc"));
    expect(res.status).toBe(400);
  });

  it("returns 400 for a renewal date in the past", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: "1", email: "a@b.com" });
    const res = await POST(makeRequest("1", { renewalDate: "2020-01-01" }) as never, ctx("1"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("validation_error");
  });

  it("returns 400 when renewalDate is missing", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: "1", email: "a@b.com" });
    const res = await POST(makeRequest("1", {}) as never, ctx("1"));
    expect(res.status).toBe(400);
  });

  it("returns 404 when the subscription isn't owned by the user", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: "1", email: "a@b.com" });
    vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null);
    const res = await POST(makeRequest("1", { renewalDate: futureDateStr() }) as never, ctx("1"));
    expect(res.status).toBe(404);
  });

  it("returns 200 and runs the renewal transaction on success", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: "1", email: "a@b.com" });
    vi.mocked(prisma.subscription.findFirst).mockResolvedValue(MOCK_SUB as never);

    const future = futureDateStr();
    const updated = { ...MOCK_SUB, renewalDate: new Date(future), status: "active" };
    vi.mocked(prisma.$transaction).mockImplementation((async (
      fn: (tx: unknown) => unknown,
    ) =>
      fn({
        renewalHistory: { create: vi.fn().mockResolvedValue({}) },
        subscription: { update: vi.fn().mockResolvedValue(updated) },
      })) as never);

    const res = await POST(makeRequest("1", { renewalDate: future }) as never, ctx("1"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("active");
    expect(prisma.$transaction).toHaveBeenCalledOnce();
  });
});
