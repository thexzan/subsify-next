import { describe, it, expect, beforeAll } from "vitest";
import { signAccessToken, verifyAccessToken } from "@/lib/jwt";

beforeAll(() => {
  process.env.NEXTAUTH_SECRET = "test-secret-at-least-32-characters-long!!";
});

describe("access token round-trip", () => {
  it("signs and verifies a valid token", async () => {
    const token = await signAccessToken({ sub: "1", email: "admin@subsify.com" });
    const payload = await verifyAccessToken(token);
    expect(payload).toEqual({ sub: "1", email: "admin@subsify.com" });
  });

  it("rejects a tampered token", async () => {
    const token = await signAccessToken({ sub: "1", email: "admin@subsify.com" });
    const tampered = token.slice(0, -3) + "abc";
    expect(await verifyAccessToken(tampered)).toBeNull();
  });

  it("rejects garbage", async () => {
    expect(await verifyAccessToken("not-a-jwt")).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signAccessToken({ sub: "1", email: "admin@subsify.com" });
    process.env.NEXTAUTH_SECRET = "a-completely-different-secret-value-here!!";
    const payload = await verifyAccessToken(token);
    process.env.NEXTAUTH_SECRET = "test-secret-at-least-32-characters-long!!";
    expect(payload).toBeNull();
  });
});
