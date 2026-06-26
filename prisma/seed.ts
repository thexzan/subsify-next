import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient, SubStatus } from "../app/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL as string);
const prisma = new PrismaClient({ adapter });

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  const passwordHash = await bcrypt.hash("subsify2025", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@subsify.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@subsify.com",
      password: passwordHash,
    },
  });

  // Relative renewal dates so every status & alert window is demonstrated
  // regardless of when the seed runs.
  const subscriptions = [
    { toolName: "Notion", department: "Engineering", renewalDate: daysFromNow(5), monthlyCost: 160000, status: SubStatus.active, notes: "Team workspace" },
    { toolName: "Figma", department: "Design", renewalDate: daysFromNow(25), monthlyCost: 225000, status: SubStatus.active, notes: null },
    { toolName: "Slack", department: "All", renewalDate: daysFromNow(-10), monthlyCost: 500000, status: SubStatus.active, notes: "Company-wide comms" },
    { toolName: "Google Workspace", department: "All", renewalDate: daysFromNow(60), monthlyCost: 1200000, status: SubStatus.active, notes: null },
    { toolName: "Semrush", department: "Marketing", renewalDate: daysFromNow(3), monthlyCost: 800000, status: SubStatus.active, notes: "SEO tooling" },
    { toolName: "Zoom", department: "HR", renewalDate: daysFromNow(120), monthlyCost: 210000, status: SubStatus.active, notes: null },
    { toolName: "Adobe CC", department: "Design", renewalDate: daysFromNow(-40), monthlyCost: 350000, status: SubStatus.expired, notes: "Creative suite" },
    { toolName: "Linear", department: "Engineering", renewalDate: daysFromNow(90), monthlyCost: 180000, status: SubStatus.active, notes: null },
    { toolName: "HubSpot", department: "Marketing", renewalDate: null, monthlyCost: 1500000, status: SubStatus.cancelled, notes: "Cancelled, evaluating alternatives" },
    { toolName: "Loom", department: "All", renewalDate: daysFromNow(12), monthlyCost: 120000, status: SubStatus.active, notes: null },
  ];

  // Reset to keep seed deterministic across re-runs.
  await prisma.subscription.deleteMany();
  await prisma.subscription.createMany({
    data: subscriptions.map((s) => ({ ...s, userId: admin.id })),
  });

  console.log(`Seeded 1 user and ${subscriptions.length} subscriptions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
