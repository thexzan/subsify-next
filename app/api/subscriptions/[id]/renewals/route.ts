import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api-auth";
import { serializeRenewal } from "@/lib/serialize";
import { unauthorized, notFound, apiError, internalError } from "@/lib/api-response";

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
    const subscription = await prisma.subscription.findFirst({
      where: { id, userId: Number(user.id) },
    });
    if (!subscription) return notFound("Subscription");

    const history = await prisma.renewalHistory.findMany({
      where: { subscriptionId: id },
      orderBy: { renewedAt: "desc" },
    });

    return NextResponse.json(history.map(serializeRenewal));
  } catch {
    return internalError();
  }
}
