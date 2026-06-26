import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { verifyAccessToken } from "./jwt";

export type AuthUser = {
  id: string;
  email: string;
};

/**
 * Resolves the authenticated user from either the NextAuth session cookie
 * (web) or an `Authorization: Bearer <JWT>` header (API clients, e.g. iOS).
 * Returns null when neither is valid.
 */
export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    const payload = await verifyAccessToken(token);
    if (payload) return { id: payload.sub, email: payload.email };
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (token?.id && typeof token.email === "string") {
    return { id: token.id as string, email: token.email };
  }

  return null;
}
