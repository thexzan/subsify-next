import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api-auth";
import { serializeSubscription } from "@/lib/serialize";
import { computeStats } from "@/lib/subscriptions";
import { unauthorized, internalError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();

  try {
    const now = new Date();
    const all = await prisma.subscription.findMany();
    const stats = computeStats(all.map((s) => serializeSubscription(s, now)));
    return NextResponse.json(stats);
  } catch {
    return internalError();
  }
}
