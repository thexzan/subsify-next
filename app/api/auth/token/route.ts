import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signAccessToken } from "@/lib/jwt";
import { apiError, validationError, internalError } from "@/lib/api-response";

// A valid bcrypt hash of a random string. Comparing against this when the user
// is not found keeps response timing uniform, avoiding user-enumeration.
const DUMMY_HASH = "$2b$10$CPN2Y51QLI98Rs0ZEGNt1O4lFo/ZGT38QKLFiolqj2HpULt8W1Dxa";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = credentialsSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    // Always run a compare so timing doesn't reveal whether the email exists.
    const valid = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);

    if (!user || !valid) {
      return apiError("unauthorized", "Invalid email or password");
    }

    const token = await signAccessToken({ sub: String(user.id), email: user.email });
    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch {
    return internalError();
  }
}
