import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .max(254)
  .transform((value) => value.toLowerCase());

export const strongPasswordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(128, "Use 128 characters or fewer.")
  .regex(/[a-z]/, "Add at least one lowercase letter.")
  .regex(/[A-Z]/, "Add at least one uppercase letter.")
  .regex(/[0-9]/, "Add at least one number.")
  .regex(/[^A-Za-z0-9]/, "Add at least one symbol.");

const nextPathSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) =>
    value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard"
  );

const optionalTrimmedString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined));

const healthGoalSchema = z
  .string()
  .trim()
  .min(2)
  .max(60)
  .regex(/^[a-zA-Z0-9 ,+&()./-]+$/);

export const authLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.").max(256),
  next: nextPathSchema
});

export const authSignupSchema = z.object({
  email: emailSchema,
  password: strongPasswordSchema,
  fullName: optionalTrimmedString(120),
  next: nextPathSchema
});

export const authResetRequestSchema = z.object({
  email: emailSchema
});

export const authUpdatePasswordSchema = z.object({
  password: strongPasswordSchema
});

export const receiptAnalyzeSchema = z.object({
  sourceType: z
    .enum(["grocery_receipt", "food_delivery", "quick_commerce"])
    .default("grocery_receipt"),
  demoMode: z.boolean().default(false),
  rawText: optionalTrimmedString(8000),
  healthGoals: z.array(healthGoalSchema).max(6).default([])
});

export const labelAnalyzeSchema = z.object({
  demoMode: z.boolean().default(false),
  rawText: optionalTrimmedString(8000),
  healthGoals: z.array(healthGoalSchema).max(6).default([])
});

export const manualMealEntrySchema = z.object({
  id: z.string().trim().max(80).optional(),
  source: z.enum(["home", "outside"]),
  mealTime: z.enum([
    "breakfast",
    "lunch",
    "evening_snack",
    "dinner",
    "late_night"
  ]),
  itemName: z.string().trim().min(2, "Enter the food item.").max(120),
  quantity: z.string().trim().min(1, "Enter quantity.").max(80),
  spiceLevel: z.enum(["none", "low", "medium", "high"]),
  notes: optionalTrimmedString(280)
});

export const foodDiarySchema = z.object({
  diaryText: optionalTrimmedString(4000),
  entries: z.array(manualMealEntrySchema).max(25).optional(),
  demoMode: z.boolean().default(false),
  healthGoals: z.array(healthGoalSchema).max(6).default([])
}).refine(
  (value) =>
    Boolean(value.diaryText?.trim()) || Boolean(value.entries && value.entries.length > 0),
  "Please add at least one food item."
);

export const reportSchema = z.object({
  userName: z.string().trim().max(120).default("DabbaDoc User"),
  dateRange: z.string().trim().max(80).default("Last 30 days"),
  reportData: z.record(z.unknown()).optional()
});

export const razorpayOrderSchema = z.object({
  plan: z.enum(["premium"]).default("premium")
});

export const razorpayVerifySchema = z.object({
  razorpay_order_id: z.string().trim().min(1).max(120),
  razorpay_payment_id: z.string().trim().min(1).max(120),
  razorpay_signature: z.string().trim().min(32).max(256)
});
