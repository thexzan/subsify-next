import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api-auth";
import { serializeSubscription } from "@/lib/serialize";
import { filterSubscriptions } from "@/lib/subscriptions";
import { subscriptionInputSchema } from "@/lib/validation";
import { unauthorized, validationError, internalError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const userId = Number(user.id);
    const [prefs, all] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { expiringThresholdDays: true },
      }),
      prisma.subscription.findMany({
        where: { userId },
        orderBy: [{ renewalDate: "asc" }, { id: "asc" }],
      }),
    ]);

    const serialized = all.map((s) => serializeSubscription(s, now));
    const result = filterSubscriptions(
      serialized,
      {
        status: searchParams.get("status"),
        search: searchParams.get("search"),
        department: searchParams.get("department"),
      },
      prefs?.expiringThresholdDays,
    );

    return NextResponse.json(result);
  } catch {
    return internalError();
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();

  try {
    const body = await req.json().catch(() => null);
    const parsed = subscriptionInputSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const data = parsed.data;
    const created = await prisma.subscription.create({
      data: {
        toolName: data.toolName,
        department: data.department,
        renewalDate: data.renewalDate ? new Date(data.renewalDate) : null,
        monthlyCost: data.monthlyCost,
        status: data.status,
        notes: data.notes,
        userId: Number(user.id),
      },
    });

    return NextResponse.json(serializeSubscription(created), { status: 201 });
  } catch {
    return internalError();
  }
}
