import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api-auth";
import {
  unauthorized,
  validationError,
  apiError,
  internalError,
} from "@/lib/api-response";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorized();

  try {
    const body = await req.json().catch(() => null);
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const user = await prisma.user.findUnique({
      where: { id: Number(authUser.id) },
    });
    if (!user) return unauthorized();

    const valid = await bcrypt.compare(parsed.data.currentPassword, user.password);
    if (!valid) {
      return apiError("bad_request", "Current password is incorrect");
    }

    const newHash = await bcrypt.hash(parsed.data.newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: newHash },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return internalError();
  }
}
