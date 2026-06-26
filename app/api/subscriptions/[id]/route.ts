import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api-auth";
import { serializeSubscription } from "@/lib/serialize";
import { subscriptionInputSchema } from "@/lib/validation";
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

export async function GET(req: NextRequest, ctx: Context) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();

  const id = parseId((await ctx.params).id);
  if (!id) return apiError("bad_request", "Invalid subscription id");

  try {
    const found = await prisma.subscription.findFirst({
      where: { id, userId: Number(user.id) },
    });
    if (!found) return notFound("Subscription");
    return NextResponse.json(serializeSubscription(found));
  } catch {
    return internalError();
  }
}

export async function PUT(req: NextRequest, ctx: Context) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();

  const id = parseId((await ctx.params).id);
  if (!id) return apiError("bad_request", "Invalid subscription id");

  try {
    const body = await req.json().catch(() => null);
    const parsed = subscriptionInputSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const existing = await prisma.subscription.findFirst({
      where: { id, userId: Number(user.id) },
    });
    if (!existing) return notFound("Subscription");

    const data = parsed.data;
    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        toolName: data.toolName,
        department: data.department,
        renewalDate: data.renewalDate ? new Date(data.renewalDate) : null,
        monthlyCost: data.monthlyCost,
        status: data.status,
        notes: data.notes,
      },
    });

    return NextResponse.json(serializeSubscription(updated));
  } catch {
    return internalError();
  }
}

export async function DELETE(req: NextRequest, ctx: Context) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();

  const id = parseId((await ctx.params).id);
  if (!id) return apiError("bad_request", "Invalid subscription id");

  try {
    const existing = await prisma.subscription.findFirst({
      where: { id, userId: Number(user.id) },
    });
    if (!existing) return notFound("Subscription");

    await prisma.subscription.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch {
    return internalError();
  }
}
