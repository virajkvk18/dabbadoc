import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { apiErrorResponse, ApiError } from "@/lib/security/api-errors";
import { enforceAiGenerationRateLimit } from "@/lib/security/abuse-protection";

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

    return NextResponse.json({
      barcode,
      productName: product.product_name ?? "Packaged food",
      labelText
    });
  } catch (error) {
    return apiErrorResponse(error, "Barcode lookup failed", 400, {
      request,
      route: "/api/barcode-product"
    });
  }
}
