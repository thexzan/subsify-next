import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api-auth";
import { serializeSubscription } from "@/lib/serialize";
import { subscriptionInputSchema, SUB_STATUS_VALUES } from "@/lib/validation";
import { unauthorized, validationError, internalError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");
    const search = searchParams.get("search")?.trim().toLowerCase();
    const department = searchParams.get("department")?.trim();

    const now = new Date();
    const all = await prisma.subscription.findMany({
      orderBy: [{ renewalDate: "asc" }, { id: "asc" }],
    });

    let result = all.map((s) => serializeSubscription(s, now));

    if (statusFilter && SUB_STATUS_VALUES.includes(statusFilter as never)) {
      result = result.filter((s) => s.effectiveStatus === statusFilter);
    }
    if (department) {
      result = result.filter((s) => s.department === department);
    }
    if (search) {
      result = result.filter(
        (s) =>
          s.toolName.toLowerCase().includes(search) ||
          s.department.toLowerCase().includes(search),
      );
    }

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
      },
    });

    return NextResponse.json(serializeSubscription(created), { status: 201 });
  } catch {
    return internalError();
  }
}
