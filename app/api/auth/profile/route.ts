import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api-auth";
import {
  unauthorized,
  validationError,
  apiError,
  internalError,
} from "@/lib/api-response";
import { profileInputSchema } from "@/lib/api-schemas";

export async function PATCH(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorized();

  try {
    const body = await req.json().catch(() => null);
    const parsed = profileInputSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const { name, email } = parsed.data;
    const userId = Number(authUser.id);

    // If the email is changing, make sure it isn't taken by someone else.
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== userId) {
      return apiError("conflict", "An account with this email already exists");
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { name, email },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({ ok: true, user: updated });
  } catch {
    return internalError();
  }
}
