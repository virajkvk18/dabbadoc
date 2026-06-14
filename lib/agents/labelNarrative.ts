import type {
  FutureHealthRisk,
  IngredientInsight,
  LabelCoverageSummary,
  NutritionFact,
  RiskFlag,
  RiskSeverity,
  SwapRecommendation
} from "@/types";

type IngredientRule = {
  pattern: RegExp;
  purposeInFood: string;
  simpleHinglishExplanation: string;
  concernLevel: IngredientInsight["concernLevel"];
  naturalOrBetterAlternative?: string;
  possibleRegularUseConcern?: string;
};

const ingredientRules: IngredientRule[] = [
  {
    pattern: /\b(maida|refined wheat flour|refined flour)\b/i,
    purposeInFood: "Soft texture aur cheap base dene ke liye.",
    simpleHinglishExplanation:
      "Maida/refined flour se product soft banta hai, but fiber kam hota hai. Roz habit banne par fullness kam aur cravings zyada ho sakti hain.",
    concernLevel: "high",
    naturalOrBetterAlternative: "Atta, oats, millet, besan, dal-based batter.",
    possibleRegularUseConcern:
      "Frequent maida habit weight gain/obesity aur blood-sugar control risk ko badha sakti hai."
  },
  {
    pattern: /\b(sugar|sucrose|glucose|liquid glucose|invert syrup|corn syrup|fructose|dextrose|maltodextrin)\b/i,
    purposeInFood: "Sweetness, browning, texture, ya bulk dene ke liye.",
    simpleHinglishExplanation:
      "Ye added sugar/carbohydrate signal hai. Taste better banata hai but fullness nahi deta.",
    concernLevel: "high",
    naturalOrBetterAlternative: "Fruit, dates in small amount, unsweetened versions.",
    possibleRegularUseConcern:
      "Most days lene par weight gain/obesity, cravings, dental cavities, aur blood-sugar risk badh sakta hai."
  },
  {
    pattern: /\b(salt|sodium chloride|sodium)\b/i,
    purposeInFood: "Taste, preservation, aur flavour balance ke liye.",
    simpleHinglishExplanation:
      "Salt/sodium taste strong banata hai. Packaged food mein ye easily zyada ho sakta hai.",
    concernLevel: "medium",
    naturalOrBetterAlternative: "Fresh herbs, lemon, roasted spices, lower-sodium options.",
    possibleRegularUseConcern:
      "Frequent high-sodium foods BP-sensitive logon ke liye concern ho sakte hain."
  },
  {
    pattern: /\b(palm oil|palmolein|vegetable oil|refined oil|edible oil|hydrogenated|vanaspati)\b/i,
    purposeInFood: "Crispiness, mouthfeel, frying stability, aur shelf life ke liye.",
    simpleHinglishExplanation:
      "Oil product ko crispy/creamy banata hai. Palm/refined oil frequent ho to saturated fat/calorie load badh sakta hai.",
    concernLevel: "medium",
    naturalOrBetterAlternative: "Home-cooked food with controlled mustard/groundnut oil, nuts/seeds in small portions.",
    possibleRegularUseConcern:
      "Regular high-fat packaged food weight gain aur heart-health sensitive diet pattern ka risk badha sakta hai."
  },
  {
    pattern: /\b(milk solids|milk powder|whey|casein|skimmed milk powder)\b/i,
    purposeInFood: "Creaminess, body, protein, aur dairy flavour ke liye.",
    simpleHinglishExplanation:
      "Dairy solids texture aur taste improve karte hain. Concern usually low hota hai unless allergy/lactose issue ho.",
    concernLevel: "low",
    naturalOrBetterAlternative: "Plain milk/curd/paneer as whole-food dairy."
  },
  {
    pattern: /\b(spices?|masala|chilli|turmeric|cumin|coriander|pepper|ginger|garlic)\b/i,
    purposeInFood: "Taste, aroma, aur Indian flavour profile ke liye.",
    simpleHinglishExplanation:
      "Spices generally taste ke liye hote hain. Main concern tab hota hai jab spicy sauce ke saath salt/oil bhi high ho.",
    concernLevel: "low",
    naturalOrBetterAlternative: "Fresh homemade masala with less salt/oil."
  },
  {
    pattern: /\b(artificial flavour|nature identical flavour|flavour enhancer|msg|monosodium glutamate|ins\s*621|e\s*621)\b/i,
    purposeInFood: "Taste ko stronger, savoury, ya addictive-feel dene ke liye.",
    simpleHinglishExplanation:
      "Flavour enhancer se taste punchy lagta hai. Alone disease nahi karta, but highly processed-food pattern ka signal ho sakta hai.",
    concernLevel: "medium",
    naturalOrBetterAlternative: "Roasted spices, garlic, onion, tomato, herbs.",
    possibleRegularUseConcern:
      "Frequent flavour-heavy snacks cravings aur overeating pattern ko support kar sakte hain."
  },
  {
    pattern: /\b(preservative|sodium benzoate|potassium sorbate|ins\s*211|e\s*211|class ii preservative)\b/i,
    purposeInFood: "Shelf life badhane aur spoilage slow karne ke liye.",
    simpleHinglishExplanation:
      "Preservative product ko lambe time tak safe/stable rakhta hai. Frequent packaged-food dependence kam rakhna better hota hai.",
    concernLevel: "medium",
    naturalOrBetterAlternative: "Fresh chutney/sauce, fresh snacks, shorter ingredient lists.",
    possibleRegularUseConcern:
      "Roz packaged preserved foods lene se overall diet quality low ho sakti hai."
  },
  {
    pattern: /\b(colou?r|synthetic food colou?r|caramel colou?r|ins\s*150d|tartrazine|sunset yellow)\b/i,
    purposeInFood: "Product ko visually attractive dikhane ke liye.",
    simpleHinglishExplanation:
      "Colour nutrition ke liye nahi hota, mainly look improve karta hai. Ye processing signal hai.",
    concernLevel: "medium",
    naturalOrBetterAlternative: "Natural colour from turmeric, beetroot, cocoa, saffron.",
    possibleRegularUseConcern:
      "Frequent coloured sugary snacks/drinks dental health, sugar load, aur cravings se linked ho sakte hain."
  },
  {
    pattern: /\b(emulsifier|stabilizer|thickener|guar gum|xanthan gum|lecithin|ins\s*322)\b/i,
    purposeInFood: "Texture smooth rakhne, separation rokne, aur consistency banane ke liye.",
    simpleHinglishExplanation:
      "Ye product ko creamy/smooth/stable banata hai. Concern usually processing level ka signal hai.",
    concernLevel: "low",
    naturalOrBetterAlternative: "Fresh homemade versions with curd, nuts, dal paste, or whole ingredients."
  },
  {
    pattern: /\b(acidity regulator|acidulant|citric acid|ins\s*330|raising agent|baking powder|sodium bicarbonate)\b/i,
    purposeInFood: "Taste, pH, rise, texture, aur shelf stability ke liye.",
    simpleHinglishExplanation:
      "Ye khatta taste/texture ya rise control karta hai. Alone major issue nahi, but processed label ka part hai.",
    concernLevel: "low",
    naturalOrBetterAlternative: "Lemon, curd, fermented batter, homemade baking in moderation."
  }
];

function cleanToken(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/^[\s:;.,\-()]+|[\s:;.,\-()]+$/g, "")
    .trim();
}

function dedupe(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.toLowerCase();
    if (!value || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function extractIngredientsFromLabel(rawText: string, extraIngredients: string[] = []) {
  const ingredientMatch = rawText.match(
    /ingredients?\s*[:\-]?\s*([\s\S]*?)(?:\n\s*(?:nutrition|nutritional|allergen|contains|net quantity|best before|mfg|manufactured|packed|customer care|fssai)\b|$)/i
  );
  const ingredientBlock = ingredientMatch?.[1] ?? "";
  const fromText = ingredientBlock
    .split(/[,;\n•]+/)
    .map(cleanToken)
    .filter((item) => item.length > 1 && !/^(and|or|contains)$/i.test(item));

  return dedupe([...fromText, ...extraIngredients.map(cleanToken)]).slice(0, 40);
}

function insightFromRule(ingredient: string, rule: IngredientRule): IngredientInsight {
  return {
    ingredient,
    purposeInFood: rule.purposeInFood,
    simpleHinglishExplanation: rule.simpleHinglishExplanation,
    concernLevel: rule.concernLevel,
    naturalOrBetterAlternative: rule.naturalOrBetterAlternative,
    possibleRegularUseConcern: rule.possibleRegularUseConcern
  };
}

function genericIngredientInsight(ingredient: string): IngredientInsight {
  return {
    ingredient,
    purposeInFood: "Label par listed hai kyunki product ki taste, texture, base, shelf life, ya nutrition profile mein iska role hai.",
    simpleHinglishExplanation:
      "Is ingredient ka exact concern label context par depend karta hai. Short ingredient list aur whole-food ingredients usually daily use ke liye better hote hain.",
    concernLevel: "unknown",
    naturalOrBetterAlternative: "Shorter ingredient list, fresh/home-style option, or minimally processed version."
  };
}

export function buildIngredientInsights(
  ingredients: string[],
  existingInsights: IngredientInsight[] = []
) {
  const byName = new Map<string, IngredientInsight>();

  existingInsights.forEach((insight) => {
    const key = insight.ingredient.trim().toLowerCase();
    if (key) byName.set(key, insight);
  });

  ingredients.forEach((ingredient) => {
    const key = ingredient.trim().toLowerCase();
    if (!key || byName.has(key)) return;

    const rule = ingredientRules.find((candidate) => candidate.pattern.test(ingredient));
    byName.set(key, rule ? insightFromRule(ingredient, rule) : genericIngredientInsight(ingredient));
  });

  return Array.from(byName.values()).slice(0, 40);
}

function parseNutritionValue(rawText: string, label: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = rawText.match(pattern);
    if (!match) continue;

    return {
      value: Number(match[1]),
      unit: match[2]?.toLowerCase(),
      raw: cleanToken(match[0])
    };
  }

  return null;
}

function concernForNutrition(label: string, value?: number, unit?: string): RiskSeverity | "unknown" {
  if (typeof value !== "number" || !Number.isFinite(value)) return "unknown";
  const lower = label.toLowerCase();

  if (lower.includes("added sugar")) return value >= 10 ? "high" : value >= 5 ? "medium" : "low";
  if (lower.includes("sugar")) return value >= 15 ? "high" : value >= 8 ? "medium" : "low";
  if (lower.includes("sodium")) {
    const mg = unit === "g" ? value * 1000 : value;
    return mg >= 600 ? "high" : mg >= 300 ? "medium" : "low";
  }
  if (lower.includes("trans fat")) return value > 0 ? "high" : "low";
  if (lower.includes("saturated")) return value >= 7 ? "high" : value >= 3 ? "medium" : "low";
  if (lower === "total fat") return value >= 25 ? "high" : value >= 12 ? "medium" : "low";
  if (lower.includes("protein")) return value >= 8 ? "low" : "medium";
  if (lower.includes("fiber")) return value >= 3 ? "low" : "medium";
  if (lower.includes("energy") || lower.includes("calories")) return value >= 450 ? "medium" : "low";

  return "unknown";
}

function nutritionInterpretation(label: string, concern: RiskSeverity | "unknown") {
  const lower = label.toLowerCase();
  if (lower.includes("added sugar")) {
    return "Added sugar directly sugar load badhata hai; frequent use se cravings, dental issues, weight gain/obesity aur blood-sugar risk badh sakta hai.";
  }
  if (lower.includes("sugar")) {
    return "Total sugar mein natural plus added sugar dono aa sakte hain. Packaged snack/drink mein high value frequent habit ke liye warning hai.";
  }
  if (lower.includes("sodium")) {
    return "Sodium namak load ka signal hai. Frequent high-sodium products BP-sensitive diet ke liye concern ho sakte hain.";
  }
  if (lower.includes("trans fat")) {
    return "Trans fat ideally zero hona chahiye. Agar visible amount hai to regular use avoid karna better hai.";
  }
  if (lower.includes("saturated")) {
    return "Saturated fat frequent high amount mein heart-health sensitive eating pattern ka concern ho sakta hai.";
  }
  if (lower === "total fat") {
    return "Fat texture/taste deta hai, but high value calorie load quickly badha sakti hai.";
  }
  if (lower.includes("protein")) {
    return concern === "low"
      ? "Protein decent hai; fullness aur meal balance mein help karta hai."
      : "Protein low lag raha hai; snack tasty ho sakta hai but filling/balanced nahi hoga.";
  }
  if (lower.includes("fiber")) {
    return concern === "low"
      ? "Fiber helpful hai; digestion aur fullness support karta hai."
      : "Fiber low lag raha hai; refined/processed snack mein fullness kam ho sakti hai.";
  }
  if (lower.includes("carbohydrate")) {
    return "Carbs energy dete hain; refined carbs + sugar high ho to frequent use watch karna chahiye.";
  }
  if (lower.includes("energy") || lower.includes("calories")) {
    return "Calories serving size ke saath compare karo. Small packet bhi calorie-dense ho sakta hai.";
  }

  return "Nutrition value detected. Serving size aur frequency ke saath judge karo.";
}

export function extractNutritionFacts(rawText: string) {
  const servingSize = rawText.match(/serving size\s*[:\-]?\s*([^\n,;]+)/i)?.[1]?.trim();
  const patterns: Array<{
    key: string;
    label: string;
    regexes: RegExp[];
    defaultUnit: string;
  }> = [
    {
      key: "calories",
      label: "Energy / Calories",
      regexes: [/\b(?:energy|calories|kcal)\b[^0-9]*(\d+(?:\.\d+)?)\s*(kcal|cal)?/i],
      defaultUnit: "kcal"
    },
    {
      key: "protein",
      label: "Protein",
      regexes: [/\bprotein\b[^0-9]*(\d+(?:\.\d+)?)\s*(g|mg)?/i],
      defaultUnit: "g"
    },
    {
      key: "carbohydrates",
      label: "Total Carbohydrates",
      regexes: [/\b(?:total\s+)?carbohydrates?\b[^0-9]*(\d+(?:\.\d+)?)\s*(g|mg)?/i],
      defaultUnit: "g"
    },
    {
      key: "sugar",
      label: "Total Sugar",
      regexes: [/\b(?:total\s+)?sugars?\b[^0-9]*(\d+(?:\.\d+)?)\s*(g|mg)?/i],
      defaultUnit: "g"
    },
    {
      key: "addedSugar",
      label: "Added Sugar",
      regexes: [/\badded\s+sugars?\b[^0-9]*(\d+(?:\.\d+)?)\s*(g|mg)?/i],
      defaultUnit: "g"
    },
    {
      key: "sodium",
      label: "Sodium",
      regexes: [/\bsodium\b[^0-9]*(\d+(?:\.\d+)?)\s*(mg|g)?/i],
      defaultUnit: "mg"
    },
    {
      key: "fats",
      label: "Total Fat",
      regexes: [/\b(?:total\s+)?fat\b[^0-9]*(\d+(?:\.\d+)?)\s*(g|mg)?/i],
      defaultUnit: "g"
    },
    {
      key: "saturatedFat",
      label: "Saturated Fat",
      regexes: [/\bsaturated\s+fat\b[^0-9]*(\d+(?:\.\d+)?)\s*(g|mg)?/i],
      defaultUnit: "g"
    },
    {
      key: "transFat",
      label: "Trans Fat",
      regexes: [/\btrans\s+fat\b[^0-9]*(\d+(?:\.\d+)?)\s*(g|mg)?/i],
      defaultUnit: "g"
    },
    {
      key: "fiber",
      label: "Dietary Fiber",
      regexes: [/\b(?:dietary\s+)?fib(?:er|re)\b[^0-9]*(\d+(?:\.\d+)?)\s*(g|mg)?/i],
      defaultUnit: "g"
    }
  ];

  const facts = patterns
    .map((pattern) => {
      const parsed = parseNutritionValue(rawText, pattern.label, pattern.regexes);
      if (!parsed) return null;
      const unit = parsed.unit || pattern.defaultUnit;
      const concernLevel = concernForNutrition(pattern.label, parsed.value, unit);
      return {
        key: pattern.key,
        fact: {
          label: pattern.label,
          value: parsed.value,
          unit,
          per: servingSize ? `per ${servingSize}` : undefined,
          raw: parsed.raw,
          concernLevel,
          interpretation: nutritionInterpretation(pattern.label, concernLevel)
        } satisfies NutritionFact
      };
    })
    .filter(Boolean) as Array<{ key: string; fact: NutritionFact }>;

  return {
    servingSize,
    facts: facts.map((row) => row.fact),
    byKey: Object.fromEntries(facts.map((row) => [row.key, row.fact.value]))
  };
}

export function buildLabelCoverageSummary(params: {
  ingredients: string[];
  ingredientInsights: IngredientInsight[];
  nutritionFacts: NutritionFact[];
}): LabelCoverageSummary {
  const additiveCount = params.ingredientInsights.filter((insight) =>
    /ins\s*\d+|preservative|colour|color|flavour|emulsifier|stabilizer|thickener|acidity|raising|antioxidant|msg|benzoate/i.test(
      `${insight.ingredient} ${insight.purposeInFood}`
    )
  ).length;

  const confidenceNote =
    params.ingredients.length > 0 && params.nutritionFacts.length > 0
      ? "Ingredients aur nutrition facts dono readable mile. Agar package ka koi side hidden/cropped hai, missing items ho sakte hain."
      : params.ingredients.length > 0
        ? "Ingredients readable mile, but nutrition table fully clear nahi tha."
        : "Ingredients/nutrition panel fully clear nahi tha. Closer, straight photo se result better hoga.";

  return {
    nutritionFactCount: params.nutritionFacts.length,
    ingredientCount: params.ingredients.length,
    additiveCount,
    confidenceNote
  };
}

export function buildLabelWarnings(params: {
  baseWarnings: RiskFlag[];
  ingredientInsights: IngredientInsight[];
  nutritionFacts: NutritionFact[];
}) {
  const warnings = [...params.baseWarnings];
  const seen = new Set(warnings.map((warning) => warning.label.toLowerCase()));

  params.ingredientInsights.forEach((insight) => {
    if (insight.concernLevel !== "high" && insight.concernLevel !== "medium") return;
    const label = `${insight.ingredient} watch`;
    const key = label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    warnings.push({
      label,
      severity: insight.concernLevel,
      reason: insight.simpleHinglishExplanation,
      possibleConcern:
        insight.possibleRegularUseConcern ||
        "Frequent use may increase long-term lifestyle health risk depending on overall diet pattern."
    });
  });

  params.nutritionFacts.forEach((fact) => {
    if (fact.concernLevel !== "high" && fact.concernLevel !== "medium") return;
    const label = `${fact.label} signal`;
    const key = label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    warnings.push({
      label,
      severity: fact.concernLevel,
      reason: fact.interpretation,
      possibleConcern:
        fact.concernLevel === "high"
          ? "If this becomes frequent, it may increase risk over time. Keep it occasional and compare serving size."
          : "Watch frequency and portion size if this is a regular product."
    });
  });

  return warnings.slice(0, 12);
}

export function buildLabelSwaps(
  currentSwaps: SwapRecommendation[],
  ingredients: string[]
): SwapRecommendation[] {
  const swaps = [...currentSwaps];
  const seen = new Set(swaps.map((swap) => `${swap.original}-${swap.swap}`.toLowerCase()));
  const ingredientText = ingredients.join(" ").toLowerCase();
  const addSwap = (swap: SwapRecommendation) => {
    const key = `${swap.original}-${swap.swap}`.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    swaps.push(swap);
  };

  if (/sugar|glucose|syrup|fructose|dextrose/.test(ingredientText)) {
    addSwap({
      original: "High/added sugar packaged option",
      swap: "unsweetened version, fruit-curd bowl, nuts, or roasted chana",
      reason: "Added sugar load kam hota hai aur fullness better milti hai.",
      costDelta: -50,
      scoreImpact: 8
    });
  }

  if (/maida|refined wheat|refined flour/.test(ingredientText)) {
    addSwap({
      original: "Maida/refined flour base",
      swap: "atta, millet, oats, besan, or dal-based option",
      reason: "Fiber and fullness improve hoti hai compared with refined flour.",
      costDelta: 0,
      scoreImpact: 7
    });
  }

  if (/palm|oil|hydrogenated|vanaspati/.test(ingredientText)) {
    addSwap({
      original: "Oil-heavy packaged snack",
      swap: "roasted makhana/chana, sprouts chaat, or homemade snack",
      reason: "Oil/calorie load lower hota hai and daily snack quality better hoti hai.",
      costDelta: -40,
      scoreImpact: 7
    });
  }

  if (/salt|sodium/.test(ingredientText)) {
    addSwap({
      original: "High-salt packaged option",
      swap: "lower-sodium pack, smaller portion, or homemade snack with curd/salad",
      reason: "Sodium load control hota hai, especially if this is eaten often.",
      costDelta: 0,
      scoreImpact: 6
    });
  }

  return swaps.slice(0, 10);
}

function addRisk(
  risks: FutureHealthRisk[],
  key: string,
  risk: FutureHealthRisk,
  seen: Set<string>
) {
  if (seen.has(key)) return;
  seen.add(key);
  risks.push(risk);
}

export function buildRegularLabelUseRisks(params: {
  nutritionFacts: NutritionFact[];
  ingredientInsights: IngredientInsight[];
  ingredients: string[];
}): FutureHealthRisk[] {
  const risks: FutureHealthRisk[] = [];
  const seen = new Set<string>();
  const evidenceText = [
    ...params.ingredients,
    ...params.nutritionFacts.map((fact) => fact.label)
  ].join(" ").toLowerCase();

  if (/sugar|glucose|syrup|fructose|dextrose|added sugar/.test(evidenceText)) {
    addRisk(
      risks,
      "sugar",
      {
        riskArea: "Weight gain/obesity, blood sugar, and dental health",
        severity: "high",
        habitFrequency: "Agar ye product most days ya 4-5 din/week repeat hota hai.",
        possibleConcern:
          "Frequent added sugar se calorie surplus, cravings, weight gain/obesity, tooth decay, aur blood-sugar control risk badh sakta hai.",
        linkedItems: params.ingredients.filter((item) => /sugar|glucose|syrup|fructose|dextrose/i.test(item)).slice(0, 6),
        preventionTip: "Daily snack/drink ke liye unsweetened option, fruit-curd bowl, nuts, roasted chana, ya plain chaas choose karo.",
        timeframe: "Single packet se disease predict nahi hoti; repeated weeks/months ka habit pattern important hota hai."
      },
      seen
    );
  }

  if (/sodium|salt|sodium chloride/.test(evidenceText)) {
    addRisk(
      risks,
      "sodium",
      {
        riskArea: "Blood-pressure sensitive eating pattern",
        severity: "medium",
        habitFrequency: "Agar salty packaged snacks/foods week mein multiple times repeat hote hain.",
        possibleConcern:
          "High sodium frequent hone par BP-sensitive logon ke liye concern ho sakta hai aur water retention bhi badh sakta hai.",
        linkedItems: params.ingredients.filter((item) => /salt|sodium/i.test(item)).slice(0, 6),
        preventionTip: "Lower-sodium version choose karo, portion half rakho, aur saath mein salad/curd/water add karo.",
        timeframe: "Weeks to months tak pattern repeat ho to sodium load monitor karna useful hai."
      },
      seen
    );
  }

  if (/palm|oil|hydrogenated|vanaspati|saturated fat|trans fat|fat/.test(evidenceText)) {
    addRisk(
      risks,
      "fat",
      {
        riskArea: "Heart-health and weight-management habits",
        severity: /trans fat|hydrogenated|vanaspati/.test(evidenceText) ? "high" : "medium",
        habitFrequency: "Agar high-fat packaged/fried items regular snack ban jate hain.",
        possibleConcern:
          "Regular high-fat processed foods calorie load, weight gain, and heart-health sensitive diet pattern ka risk badha sakte hain.",
        linkedItems: params.ingredients.filter((item) => /palm|oil|hydrogenated|vanaspati/i.test(item)).slice(0, 6),
        preventionTip: "Roasted makhana/chana, nuts in controlled portion, sprouts chaat, ya homemade snack better daily options hain.",
        timeframe: "Repeated habit over weeks/months matters more than one occasional treat."
      },
      seen
    );
  }

  if (/maida|refined wheat|refined flour|wheat flour/.test(evidenceText)) {
    addRisk(
      risks,
      "refined",
      {
        riskArea: "Low fiber, cravings, and blood-sugar control",
        severity: "medium",
        habitFrequency: "Agar maida/refined-carb products daily base banne lagte hain.",
        possibleConcern:
          "Refined flour fiber kam deta hai, fullness kam hoti hai, cravings badh sakti hain, aur blood-sugar control risk increase ho sakta hai.",
        linkedItems: params.ingredients.filter((item) => /maida|refined|wheat flour/i.test(item)).slice(0, 6),
        preventionTip: "Atta, millet, oats, besan, dal-based batter, ya whole-grain versions choose karo.",
        timeframe: "Daily pattern over months is the main signal."
      },
      seen
    );
  }

  if (/preservative|colour|color|flavour enhancer|emulsifier|stabilizer|ins\s*\d+/.test(evidenceText)) {
    addRisk(
      risks,
      "processing",
      {
        riskArea: "Highly processed food dependence",
        severity: "medium",
        habitFrequency: "Agar long ingredient-list packaged foods frequently replace fresh meals/snacks.",
        possibleConcern:
          "Additives alone diagnosis signal nahi hote, but long ingredient list usually highly processed food pattern dikhata hai, jisme sugar/salt/fat load bhi high ho sakta hai.",
        linkedItems: params.ingredients.filter((item) =>
          /preservative|colour|color|flavour|emulsifier|stabilizer|ins\s*\d+/i.test(item)
        ).slice(0, 6),
        preventionTip: "Short ingredient list, fresh/home-style food, ya minimally processed version prefer karo.",
        timeframe: "Overall weekly pattern ko watch karo, one-time treat ko nahi."
      },
      seen
    );
  }

  return risks.slice(0, 5);
}
