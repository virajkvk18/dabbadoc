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

export const authLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.").max(256),
  next: nextPathSchema
});

export const authSignupSchema = z.object({
  email: emailSchema,
  password: strongPasswordSchema,
  fullName: z.string().trim().max(120).optional(),
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
  demoMode: z.boolean().default(false)
});

export const labelAnalyzeSchema = z.object({
  demoMode: z.boolean().default(false)
});

export const manualMealEntrySchema = z.object({
  id: z.string().optional(),
  source: z.enum(["home", "outside"]),
  mealTime: z.enum([
    "breakfast",
    "lunch",
    "evening_snack",
    "dinner",
    "late_night"
  ]),
  itemName: z.string().min(2, "Enter the food item."),
  quantity: z.string().min(1, "Enter quantity."),
  spiceLevel: z.enum(["none", "low", "medium", "high"]),
  notes: z.string().optional()
});

export const foodDiarySchema = z.object({
  diaryText: z.string().optional(),
  entries: z.array(manualMealEntrySchema).optional(),
  demoMode: z.boolean().default(false)
}).refine(
  (value) =>
    Boolean(value.diaryText?.trim()) || Boolean(value.entries && value.entries.length > 0),
  "Please add at least one food item."
);

export const reportSchema = z.object({
  userName: z.string().default("DabbaDoc User"),
  dateRange: z.string().default("Last 30 days"),
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
