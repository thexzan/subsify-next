import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api-auth";
import { serializeSubscription } from "@/lib/serialize";
import { renewSchema } from "@/lib/validation";
import {
  unauthorized,
  validationError,
  notFound,
  apiError,
  internalError,
} from "@/lib/api-response";

type Context = { params: Promise<{ id: string }> };

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function POST(req: NextRequest, ctx: Context) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();

  const id = parseId((await ctx.params).id);
  if (!id) return apiError("bad_request", "Invalid subscription id");

  try {
    const body = await req.json().catch(() => null);
    const parsed = renewSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const existing = await prisma.subscription.findFirst({
      where: { id, userId: Number(user.id) },
    });
    if (!existing) return notFound("Subscription");

    const newDate = new Date(parsed.data.renewalDate);

    const updated = await prisma.$transaction(async (tx) => {
      await tx.renewalHistory.create({
        data: {
          subscriptionId: id,
          previousRenewalDate: existing.renewalDate,
          newRenewalDate: newDate,
          costSnapshot: existing.monthlyCost,
          previousStatus: existing.status,
        },
      });
      return tx.subscription.update({
        where: { id },
        data: { renewalDate: newDate, status: "active" },
      });
    });

    return NextResponse.json(serializeSubscription(updated));
  } catch {
    return internalError();
  }
}
