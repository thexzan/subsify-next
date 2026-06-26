import { z } from "zod";

export const SUB_STATUS_VALUES = [
  "active",
  "expiring_soon",
  "expired",
  "cancelled",
] as const;

export const subscriptionInputSchema = z.object({
  toolName: z.string().trim().min(1, "Tool name is required").max(100),
  department: z.string().trim().min(1, "Department is required").max(100),
  renewalDate: z
    .union([z.iso.date(), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v ? v : null)),
  monthlyCost: z.coerce.number().nonnegative("Cost must be zero or positive"),
  status: z.enum(SUB_STATUS_VALUES),
  notes: z
    .union([z.string().max(5000), z.null()])
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
});

export type SubscriptionInput = z.infer<typeof subscriptionInputSchema>;
