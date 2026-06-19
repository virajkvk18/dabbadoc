import { Router } from "express";
import { requireSupabaseUser } from "../middleware/auth.js";
import { integrationRateLimit } from "../middleware/rate-limit.js";
import { asyncHandler } from "../middleware/errors.js";
import { lookupBarcodeProduct } from "../services/open-food-facts.js";

export const barcodeRouter = Router();

barcodeRouter.get(
  "/product/:barcode",
  requireSupabaseUser,
  integrationRateLimit,
  asyncHandler(async (request, response) => {
    const barcode = Array.isArray(request.params.barcode)
      ? request.params.barcode[0]
      : request.params.barcode;
    const product = await lookupBarcodeProduct(barcode ?? "");
    response.json(product);
  })
);

barcodeRouter.get(
  "/product",
  requireSupabaseUser,
  integrationRateLimit,
  asyncHandler(async (request, response) => {
    const barcode = String(request.query.barcode ?? "");
    const product = await lookupBarcodeProduct(barcode);
    response.json(product);
  })
);
