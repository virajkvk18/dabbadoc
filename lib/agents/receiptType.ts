import type { ReceiptType } from "@/types";

const restaurantSignals = [
  "table no",
  "server",
  "guests",
  "dine in",
  "starter",
  "starters",
  "soups",
  "main course",
  "breads",
  "biryani",
  "desserts",
  "beverages",
  "service charge",
  "cgst",
  "sgst",
  "restaurant",
  "kebab",
  "naan",
  "roti",
  "paratha",
  "paneer butter",
  "dal makhani",
  "butter chicken"
];

const packagedLabelSignals = [
  "ingredients",
  "nutrition",
  "nutrition facts",
  "per 100g",
  "serving size",
  "added sugar",
  "saturated fat",
  "trans fat",
  "sodium"
];

const grocerySignals = [
  "mrp",
  "qty",
  "quantity",
  "grocery",
  "supermarket",
  "mart",
  "freshmart",
  "item total",
  "sku",
  "hsn",
  "barcode"
];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function countSignals(text: string, signals: string[]) {
  return signals.reduce((count, signal) => {
    return text.includes(normalize(signal)) ? count + 1 : count;
  }, 0);
}

export function detectReceiptType(rawText: string): ReceiptType {
  const text = normalize(rawText);
  if (!text) return "unknown";

  const restaurantScore = countSignals(text, restaurantSignals);
  const labelScore = countSignals(text, packagedLabelSignals);
  const groceryScore = countSignals(text, grocerySignals);

  if (restaurantScore >= 3) return "restaurant_bill";
  if (labelScore >= 3 && restaurantScore < 2) return "packaged_food_label";
  if (groceryScore >= 2) return "grocery_receipt";
  if (restaurantScore >= 2 && groceryScore === 0 && labelScore < 2) return "restaurant_bill";
  if (restaurantScore >= 2 && /bill|total|amount|tax/.test(text)) return "restaurant_bill";

  return "unknown";
}
