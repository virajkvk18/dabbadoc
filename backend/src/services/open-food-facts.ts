import { ApiError } from "../middleware/errors.js";

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

function nutritionNumber(value: string | number | undefined) {
  const parsed = typeof value === "number" ? value : Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : undefined;
}

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

export async function lookupBarcodeProduct(barcode: string) {
  const normalized = barcode.replace(/\D/g, "");
  if (!normalized || normalized.length < 8 || normalized.length > 14) {
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
    `https://world.openfoodfacts.org/api/v2/product/${normalized}?fields=${fields}`,
    {
      headers: {
        "User-Agent": "DabbaDoc/1.0 Node Express backend"
      }
    }
  );

  if (!response.ok) {
    throw new ApiError(
      "Barcode lookup failed. Try manual label text.",
      response.status === 404 ? 404 : 502
    );
  }

  const data = (await response.json()) as OpenFoodFactsResponse;
  if (data.status !== 1 || !data.product) {
    throw new ApiError("Product was not found for this barcode.", 404);
  }

  const product = data.product;
  const sugar = nutritionNumber(product.nutriments?.sugars_100g);
  const sodiumGrams = nutritionNumber(product.nutriments?.sodium_100g);
  const warnings = [
    typeof sugar === "number" && sugar >= 15
      ? `${sugar}g sugar per 100g is high for frequent use.`
      : null,
    typeof sodiumGrams === "number" && sodiumGrams >= 0.6
      ? `${sodiumGrams}g sodium per 100g is high.`
      : null,
    (product.nova_group ?? 0) >= 4 ? "NOVA group 4 indicates ultra-processed food." : null
  ].filter(Boolean);

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

  return {
    barcode: normalized,
    productName: product.product_name ?? "Packaged food",
    brand: product.brands ?? null,
    quantity: product.quantity ?? null,
    nutritionGrade: product.nutrition_grades ?? null,
    novaGroup: product.nova_group ?? null,
    labelText,
    warnings
  };
}
