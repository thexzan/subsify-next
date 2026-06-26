import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, validationError, internalError } from "@/lib/api-response";

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(100),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return apiError("conflict", "An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { name, email, password: passwordHash },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return internalError();
  }
}
