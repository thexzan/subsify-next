import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api-auth";
import { computeEffectiveStatus } from "@/lib/status";
import { unauthorized, internalError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();

  try {
    const now = new Date();
    const all = await prisma.subscription.findMany();

    const stats = {
      total: all.length,
      active: 0,
      expiring_soon: 0,
      expired: 0,
      cancelled: 0,
      total_monthly_cost: 0,
    };

    for (const sub of all) {
      const effective = computeEffectiveStatus(sub.status, sub.renewalDate, now);
      stats[effective] += 1;
      if (effective === "active" || effective === "expiring_soon") {
        stats.total_monthly_cost += Number(sub.monthlyCost);
      }
    }

    return NextResponse.json(stats);
  } catch {
    return internalError();
  }
}
