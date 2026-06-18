import foodDb from "@/data/indian-food-db.json";
import type { FoodItem } from "@/types";

type FoodDbRow = {
  name: string;
  aliases: string[];
  category: string;
  riskTags: string[];
  calories: number;
  protein: number;
  monthlyCost: number;
};

const rows = foodDb as FoodDbRow[];

const receiptNoisePattern =
  /\b(total|subtotal|sub total|grand total|tax|gst|cgst|sgst|igst|invoice|bill no|receipt|order id|payment|paid|cash|card|upi|change|round off|roundoff|balance|date|time|mobile|phone|address|thank you|qty\s+rate|rate\s+amount|amount\s+qty|hsn|mrp)\b/i;

const unitPattern =
  /\b\d+(?:[.,]\d+)?\s*(kg|kgs|g|gm|gms|gram|grams|ml|l|ltr|litre|litres|pcs|pc|piece|pieces|pack|packs|pkt|pkts|packet|packets|plate|plates|box|boxes|bottle|bottles)\b/i;

const pricePattern =
  /(?:rs\.?|inr|mrp|amt|amount)?\s*(\d{1,5}(?:[.,]\d{1,2})?)\s*$/i;

const categoryRules: Array<{
  category: string;
  flags: string[];
  keywords: string[];
  calories: number;
  protein: number;
}> = [
  {
    category: "sugary_drink",
    flags: ["high_sugar", "ultra_processed"],
    keywords: [
      "cola",
      "coke",
      "pepsi",
      "sprite",
      "thums",
      "mirinda",
      "fanta",
      "soft drink",
      "soda",
      "juice",
      "maaza",
      "frooti",
      "energy drink"
    ],
    calories: 140,
    protein: 0
  },
  {
    category: "packaged_snack",
    flags: ["high_sodium", "fried", "processed"],
    keywords: [
      "chips",
      "lays",
      "kurkure",
      "namkeen",
      "bhujia",
      "sev",
      "mixture",
      "wafer",
      "popcorn"
    ],
    calories: 250,
    protein: 3
  },
  {
    category: "sweet_packaged_food",
    flags: ["added_sugar", "processed"],
    keywords: [
      "biscuit",
      "cookie",
      "chocolate",
      "cake",
      "pastry",
      "ice cream",
      "cream roll",
      "candy",
      "sweet"
    ],
    calories: 210,
    protein: 3
  },
  {
    category: "instant_processed",
    flags: ["processed", "high_sodium", "low_protein"],
    keywords: [
      "maggi",
      "noodle",
      "instant",
      "soup",
      "pasta",
      "sauce",
      "ketchup",
      "frozen",
      "ready to eat"
    ],
    calories: 360,
    protein: 8
  },
  {
    category: "outside_food",
    flags: ["refined_flour", "high_sodium", "processed"],
    keywords: [
      "momo",
      "pizza",
      "burger",
      "roll",
      "shawarma",
      "sandwich",
      "pav",
      "naan",
      "nan",
      "butter naan",
      "garlic naan",
      "tandoori roti",
      "paratha",
      "kulcha",
      "frankie",
      "biryani",
      "fried rice",
      "chowmein"
    ],
    calories: 420,
    protein: 12
  },
  {
    category: "fried",
    flags: ["fried", "high_fat", "refined_flour"],
    keywords: ["samosa", "kachori", "pakora", "vada", "fries", "bhatura", "puri"],
    calories: 320,
    protein: 6
  },
  {
    category: "protein",
    flags: ["protein"],
    keywords: [
      "paneer",
      "egg",
      "eggs",
      "curd",
      "dahi",
      "milk",
      "tofu",
      "chicken",
      "fish",
      "dal",
      "chana",
      "rajma",
      "sprout",
      "soya"
    ],
    calories: 220,
    protein: 14
  },
  {
    category: "whole_food",
    flags: ["whole_food", "fiber"],
    keywords: [
      "atta",
      "rice",
      "poha",
      "oats",
      "dalia",
      "ragi",
      "millet",
      "jowar",
      "bajra",
      "fruit",
      "banana",
      "apple",
      "vegetable",
      "sabzi",
      "tomato",
      "onion",
      "potato"
    ],
    calories: 230,
    protein: 6
  },
  {
    category: "oil_or_fat",
    flags: ["palm_oil", "high_fat"],
    keywords: ["oil", "refined oil", "palm oil", "vanaspati", "ghee", "butter"],
    calories: 120,
    protein: 0
  },
  {
    category: "sugar_or_sweetener",
    flags: ["added_sugar"],
    keywords: ["sugar", "jaggery", "shakkar", "syrup"],
    calories: 80,
    protein: 0
  }
];

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function normalizeFoodText(value: string) {
  return normalizeText(value);
}

function parsePrice(line: string) {
  const match = line.match(pricePattern);
  if (!match) return undefined;

  const price = Number.parseFloat(match[1].replace(",", "."));
  if (!Number.isFinite(price) || price <= 0 || price > 100000) return undefined;
  return price;
}

function parseQuantity(line: string) {
  const unitMatch = line.match(unitPattern);
  if (unitMatch) return unitMatch[0].replace(/\s+/g, " ");

  const multiplierMatch = line.match(/\b\d+\s*[xX]\b|\b[xX]\s*\d+\b/);
  return multiplierMatch?.[0].replace(/\s+/g, "");
}

function cleanItemName(line: string) {
  return line
    .replace(pricePattern, " ")
    .replace(unitPattern, " ")
    .replace(/\b(?:rs\.?|inr|mrp|qty|rate|amount|amt|net|item|items)\b/gi, " ")
    .replace(/\b\d{4,}\b/g, " ")
    .replace(/\b\d+(?:[.,]\d+)?\b/g, " ")
    .replace(/[^a-zA-Z0-9&.\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsFoodKeyword(value: string) {
  const normalized = normalizeText(value);
  return categoryRules.some((rule) =>
    rule.keywords.some((keyword) => normalized.includes(normalizeText(keyword)))
  );
}

function shouldSkipReceiptLine(line: string) {
  const trimmed = line.trim();
  if (trimmed.length < 3) return true;
  if (!/[a-zA-Z]/.test(trimmed)) return true;
  if (/^\d+([:./-]\d+)+$/.test(trimmed)) return true;

  const hasFoodKeyword = containsFoodKeyword(trimmed);
  const hasKnownAlias = rows.some((row) =>
    row.aliases.some((alias) => normalizeText(trimmed).includes(normalizeText(alias)))
  );

  return receiptNoisePattern.test(trimmed) && !hasFoodKeyword && !hasKnownAlias;
}

function inferItemProfile(name: string) {
  const normalized = normalizeText(name);
  const rule = categoryRules.find((candidate) =>
    candidate.keywords.some((keyword) => normalized.includes(normalizeText(keyword)))
  );

  if (rule) {
    return {
      category: rule.category,
      flags: rule.flags,
      calorieEstimate: rule.calories,
      proteinEstimate: rule.protein
    };
  }

  return {
    category: "receipt_item",
    flags: [] as string[],
    calorieEstimate: 180,
    proteinEstimate: 4
  };
}

export function foodItemFromName(name: string, sourceLine = ""): FoodItem | null {
  const cleanedName = cleanItemName(name);
  const normalizedName = normalizeText(cleanedName);
  if (normalizedName.length < 3 || /^(no|na|nil|none|item)$/.test(normalizedName)) {
    return null;
  }

  const row = findFoodDbRow(cleanedName);
  if (row) {
    return {
      name: row.name,
      category: row.category,
      quantity: parseQuantity(sourceLine),
      price: parsePrice(sourceLine),
      flags: row.riskTags,
      confidence: 0.92,
      calorieEstimate: row.calories,
      proteinEstimate: row.protein
    };
  }

  const profile = inferItemProfile(cleanedName);
  return {
    name: cleanedName,
    category: profile.category,
    quantity: parseQuantity(sourceLine),
    price: parsePrice(sourceLine),
    flags: profile.flags,
    confidence: containsFoodKeyword(cleanedName) ? 0.78 : 0.62,
    calorieEstimate: profile.calorieEstimate,
    proteinEstimate: profile.proteinEstimate
  };
}

function findLineForAlias(lines: string[], aliases: string[]) {
  return lines.find((line) =>
    aliases.some((alias) => normalizeText(line).includes(normalizeText(alias)))
  );
}

function parseKnownFoodItems(text: string, lines: string[]) {
  const normalizedText = normalizeText(text);

  return rows
    .filter((row) =>
      row.aliases.some((alias) => normalizedText.includes(normalizeText(alias)))
    )
    .map<FoodItem>((row) => {
      const sourceLine = findLineForAlias(lines, row.aliases) ?? "";

      return {
        name: row.name,
        category: row.category,
        quantity: parseQuantity(sourceLine),
        price: parsePrice(sourceLine),
        flags: row.riskTags,
        confidence: 0.9,
        calorieEstimate: row.calories,
        proteinEstimate: row.protein
      };
    });
}

function parseReceiptLineItems(lines: string[]) {
  const seen = new Set<string>();
  const items: FoodItem[] = [];

  for (const line of lines) {
    if (shouldSkipReceiptLine(line)) continue;

    const name = cleanItemName(line);
    const normalizedName = normalizeText(name);
    if (normalizedName.length < 3 || seen.has(normalizedName)) continue;
    if (/^(no|na|nil|none|item)$/.test(normalizedName)) continue;

    seen.add(normalizedName);
    const item = foodItemFromName(name, line);
    if (item) items.push(item);
  }

  return items;
}

export function parseFoodItemsFromText(text: string): FoodItem[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const knownItems = parseKnownFoodItems(text, lines);
  const knownAliasLines = new Set(
    lines
      .filter((line) =>
        rows.some((row) =>
          row.aliases.some((alias) => normalizeText(line).includes(normalizeText(alias)))
        )
      )
      .map(normalizeText)
  );

  const receiptItems = parseReceiptLineItems(lines).filter((item) => {
    const normalizedName = normalizeText(item.name);
    const cameFromKnownLine = Array.from(knownAliasLines).some((line) =>
      line.includes(normalizedName)
    );

    return (
      !knownItems.some((known) => normalizeText(known.name) === normalizedName) &&
      !cameFromKnownLine
    );
  });

  return [...knownItems, ...receiptItems].slice(0, 40);
}

export function mergeFoodItems(items: FoodItem[]) {
  const merged = new Map<string, FoodItem>();

  for (const item of items) {
    const key = normalizeText(item.name);
    if (!key) continue;

    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, item);
      continue;
    }

    merged.set(key, {
      ...existing,
      ...item,
      name: existing.name.length <= item.name.length ? existing.name : item.name,
      quantity: existing.quantity ?? item.quantity,
      price: existing.price ?? item.price,
      confidence: Math.max(existing.confidence ?? 0, item.confidence ?? 0),
      flags: Array.from(new Set([...(existing.flags ?? []), ...(item.flags ?? [])])),
      calorieEstimate: existing.calorieEstimate ?? item.calorieEstimate,
      proteinEstimate: existing.proteinEstimate ?? item.proteinEstimate
    });
  }

  return Array.from(merged.values()).slice(0, 40);
}

export function findFoodDbRow(name: string) {
  return rows.find(
    (row) =>
      row.name.toLowerCase() === name.toLowerCase() ||
      row.aliases.some((alias) => alias.toLowerCase() === name.toLowerCase())
  );
}

export function getFoodRows() {
  return rows;
}
