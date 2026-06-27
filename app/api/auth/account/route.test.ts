import { describe, it, expect, vi, beforeEach } from "vitest";
import { DELETE } from "./route";

vi.mock("@/lib/api-auth", () => ({ getAuthUser: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: vi.fn(), delete: vi.fn() } },
}));
vi.mock("bcryptjs", () => ({ default: { compare: vi.fn() } }));

import { getAuthUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const mockUser = { id: 1, email: "user@example.com", password: "hashed" };

function makeRequest(body?: unknown) {
  return new Request("http://localhost/api/auth/account", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("DELETE /api/auth/account", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null);
    const res = await DELETE(makeRequest({ password: "secret" }) as never);
    expect(res.status).toBe(401);
  });

  it("returns 400 when body is missing password", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: "1", email: mockUser.email });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);
    const res = await DELETE(makeRequest({}) as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("validation_error");
  });

  it("returns 400 when password is incorrect", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: "1", email: mockUser.email });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    const res = await DELETE(makeRequest({ password: "wrong" }) as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("bad_request");
  });

  it("deletes account and returns ok when password is correct", async () => {
    vi.mocked(getAuthUser).mockResolvedValue({ id: "1", email: mockUser.email });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(prisma.user.delete).mockResolvedValue(mockUser as never);
    const res = await DELETE(makeRequest({ password: "correct" }) as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true });
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
