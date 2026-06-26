import { z } from "zod";
import { SUB_STATUS_VALUES } from "./validation";

export const subscriptionResponseSchema = z.object({
  id: z.number(),
  toolName: z.string(),
  department: z.string(),
  renewalDate: z.string().nullable(),
  monthlyCost: z.number(),
  status: z.enum(SUB_STATUS_VALUES),
  effectiveStatus: z.enum(SUB_STATUS_VALUES),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const statsResponseSchema = z.object({
  total: z.number(),
  active: z.number(),
  expiring_soon: z.number(),
  expired: z.number(),
  cancelled: z.number(),
  total_monthly_cost: z.number(),
});

export const tokenResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.number(),
    email: z.string(),
    name: z.string(),
  }),
});

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.unknown()).optional(),
  }),
});

export const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

export const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(100),
  password: z.string().min(8),
});

export const profileInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(100),
});
