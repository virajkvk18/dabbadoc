import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { apiErrorResponse, ApiError } from "@/lib/security/api-errors";
import { enforceAiGenerationRateLimit } from "@/lib/security/abuse-protection";
import { saveLabelAnalysis, saveUploadRecord } from "@/lib/supabase/mutations";
import type { LabelAnalysis, RiskFlag } from "@/types";

type OpenFoodFactsResponse = {
  status?: number;
  product?: {
    product_name?: string;
    brands?: string;
    ingredients_text?: string;
    quantity?: string;
    nutrition_grades?: string;
    nova_group?: number;
    nutriments?: Record<string, string | number | undefined>;
  };
};

function nutritionLine(nutriments: Record<string, string | number | undefined> = {}) {
  const rows = [
    ["Energy", nutriments["energy-kcal_100g"], "kcal per 100g"],
    ["Protein", nutriments.proteins_100g, "g per 100g"],
    ["Sugar", nutriments.sugars_100g, "g per 100g"],
    ["Fat", nutriments.fat_100g, "g per 100g"],
    ["Saturated fat", nutriments["saturated-fat_100g"], "g per 100g"],
    ["Sodium", nutriments.sodium_100g, "g per 100g"],
    ["Salt", nutriments.salt_100g, "g per 100g"],
    ["Fiber", nutriments.fiber_100g, "g per 100g"]
  ];

  return rows
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([label, value, unit]) => `${label}: ${value} ${unit}`)
    .join("\n");
}

function nutritionNumber(value: string | number | undefined) {
  const parsed = typeof value === "number" ? value : Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : undefined;
}

function barcodeAnalysis(
  barcode: string,
  product: NonNullable<OpenFoodFactsResponse["product"]>,
  labelText: string
): LabelAnalysis {
  const sugar = nutritionNumber(product.nutriments?.sugars_100g);
  const sodiumGrams = nutritionNumber(product.nutriments?.sodium_100g);
  const warnings: RiskFlag[] = [];
  if (typeof sugar === "number" && sugar >= 15) {
    warnings.push({
      label: "High sugar barcode signal",
      severity: sugar >= 25 ? "high" : "medium",
      reason: `${sugar}g sugar per 100g was listed in the barcode data.`,
      possibleConcern: "Frequent high-sugar intake may increase the possibility of energy crashes and weight gain."
    });
  }
  if (typeof sodiumGrams === "number" && sodiumGrams >= 0.6) {
    warnings.push({
      label: "High sodium barcode signal",
      severity: sodiumGrams >= 1 ? "high" : "medium",
      reason: `${sodiumGrams}g sodium per 100g was listed in the barcode data.`,
      possibleConcern: "Frequent high-sodium packaged food may increase blood-pressure risk over time."
    });
  }
  if ((product.nova_group ?? 0) >= 4) {
    warnings.push({
      label: "Ultra-processed food pattern",
      severity: "medium",
      reason: "The product is listed as NOVA group 4.",
      possibleConcern: "Frequent ultra-processed foods may increase sugar, sodium, and unhealthy-fat exposure."
    });
  }
  const gradeScore: Record<string, number> = { a: 85, b: 75, c: 60, d: 45, e: 30 };
  const score = gradeScore[product.nutrition_grades?.toLowerCase() ?? ""] ?? 55;

  return {
    extractedText: labelText,
    productName: product.product_name ?? "Packaged food",
    ingredients: product.ingredients_text
      ? product.ingredients_text.split(",").map((ingredient) => ingredient.trim()).filter(Boolean)
      : [],
    nutrition: {
      calories: nutritionNumber(product.nutriments?.["energy-kcal_100g"]),
      protein: nutritionNumber(product.nutriments?.proteins_100g),
      sugar,
      sodium: typeof sodiumGrams === "number" ? sodiumGrams * 1000 : undefined,
      fats: nutritionNumber(product.nutriments?.fat_100g),
      saturatedFat: nutritionNumber(product.nutriments?.["saturated-fat_100g"]),
      fiber: nutritionNumber(product.nutriments?.fiber_100g),
      servingSize: "per 100g"
    },
    labelTruthScore: score,
    safetyLevel: score >= 75 ? "daily-safe" : score >= 50 ? "sometimes-safe" : "avoid-frequent-use",
    whatYouThought: "Barcode product reference",
    whatLabelSays: labelText,
    warnings,
    betterAlternatives: [],
    aiSummary: warnings.length
      ? "Barcode lookup saved with possible food-risk signals for day-wise tracking."
      : "Barcode lookup saved for day-wise packaged-food tracking.",
    disclaimer: "This is an early-warning pattern, not a diagnosis. Consult a doctor or dietitian for medical advice."
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireVerifiedUser();
    enforceAiGenerationRateLimit(request, user.id, "barcode-lookup");

    const barcode = request.nextUrl.searchParams.get("barcode")?.replace(/\D/g, "");
    if (!barcode || barcode.length < 8 || barcode.length > 14) {
      throw new ApiError("Enter a valid barcode number.", 400);
    }

    const fields = [
      "product_name",
      "brands",
      "ingredients_text",
      "quantity",
      "nutrition_grades",
      "nova_group",
      "nutriments"
    ].join(",");
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=${fields}`,
      {
        headers: {
          "User-Agent": "DabbaDoc/1.0 (food health analysis app)"
        },
        cache: "no-store"
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new ApiError("Product was not found for this barcode. Try another barcode or paste label text in LabelScan.", 404);
      }

      throw new ApiError("Barcode lookup failed. Try manual label text.", 502);
    }

    const data = (await response.json()) as OpenFoodFactsResponse;
    if (data.status !== 1 || !data.product) {
      throw new ApiError("Product was not found for this barcode.", 404);
    }

    const product = data.product;
    const labelText = [
      product.product_name,
      product.brands ? `Brand: ${product.brands}` : null,
      product.quantity ? `Quantity: ${product.quantity}` : null,
      product.ingredients_text ? `Ingredients: ${product.ingredients_text}` : null,
      product.nutrition_grades ? `Nutri-Score: ${product.nutrition_grades}` : null,
      product.nova_group ? `NOVA group: ${product.nova_group}` : null,
      nutritionLine(product.nutriments)
    ]
      .filter(Boolean)
      .join("\n");

    let saved = false;
    try {
      const uploadId = await saveUploadRecord({
        userId: user.id,
        fileType: "application/barcode",
        sourceType: "packaged_label"
      });
      await saveLabelAnalysis({
        userId: user.id,
        uploadId,
        analysis: barcodeAnalysis(barcode, product, labelText),
        metadata: {
          scanSource: "barcode_scan",
          barcode,
          novaGroup: product.nova_group ?? null,
          nutritionGrade: product.nutrition_grades ?? null
        }
      });
      saved = true;
    } catch {
      saved = false;
    }

    return NextResponse.json({
      barcode,
      productName: product.product_name ?? "Packaged food",
      labelText,
      saved,
      warning: saved ? undefined : "Product found, but this barcode could not be attached to My Diary yet."
    });
  } catch (error) {
    return apiErrorResponse(error, "Barcode lookup failed", 400, {
      request,
      route: "/api/barcode-product"
    });
  }
}
