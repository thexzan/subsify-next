import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api-auth";
import {
  unauthorized,
  validationError,
  apiError,
  internalError,
} from "@/lib/api-response";
import { deleteAccountSchema } from "@/lib/api-schemas";

export async function DELETE(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorized();

  try {
    const body = await req.json().catch(() => null);
    const parsed = deleteAccountSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const user = await prisma.user.findUnique({
      where: { id: Number(authUser.id) },
    });
    if (!user) return unauthorized();

    const valid = await bcrypt.compare(parsed.data.password, user.password);
    if (!valid) {
      return apiError("bad_request", "Incorrect password");
    }

    await prisma.user.delete({ where: { id: user.id } });

    return NextResponse.json({ ok: true });
  } catch {
    return internalError();
  }
}
