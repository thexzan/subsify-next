import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api-auth";
import { unauthorized, validationError, internalError } from "@/lib/api-response";
import { preferencesInputSchema } from "@/lib/api-schemas";

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorized();

  try {
    const prefs = await prisma.user.findUnique({
      where: { id: Number(authUser.id) },
      select: { expiringThresholdDays: true, urgentThresholdDays: true },
    });
    if (!prefs) return unauthorized();
    return NextResponse.json(prefs);
  } catch {
    return internalError();
  }
}

export async function PATCH(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorized();

  try {
    const body = await req.json().catch(() => null);
    const parsed = preferencesInputSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const updated = await prisma.user.update({
      where: { id: Number(authUser.id) },
      data: parsed.data,
      select: { expiringThresholdDays: true, urgentThresholdDays: true },
    });

    return NextResponse.json(updated);
  } catch {
    return internalError();
  }
}
