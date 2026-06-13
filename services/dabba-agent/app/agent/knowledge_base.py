"""Small local knowledge base for Dabba Agent.

This file is not a replacement for a nutrition database. It gives deterministic
backup rules when the LLM is unavailable and helps keep output consistent.
"""

FOOD_RULES = {
    "maggi": {
        "tags": ["refined_flour", "high_sodium", "low_protein", "processed"],
        "category": "instant noodles",
        "swap": "vegetable poha / dalia / atta noodles with paneer or sprouts",
        "why": "Instant noodles are often low in protein and high in sodium/refined carbs.",
    },
    "instant noodles": {
        "tags": ["refined_flour", "high_sodium", "processed"],
        "category": "instant noodles",
        "swap": "homemade veggie noodles with whole wheat noodles + egg/paneer/tofu",
        "why": "Frequent instant noodles may add excess sodium and refined carbs.",
    },
    "samosa": {
        "tags": ["fried", "refined_flour", "high_fat"],
        "category": "fried snack",
        "swap": "baked samosa / sprouts chaat / roasted makhana",
        "why": "Deep-fried maida snacks can increase calorie load quickly.",
    },
    "kachori": {
        "tags": ["fried", "refined_flour", "high_fat"],
        "category": "fried snack",
        "swap": "moong dal chilla / sprouts chaat / dhokla",
        "why": "Deep-fried snacks are calorie-dense and usually low in protein.",
    },
    "burger": {
        "tags": ["refined_flour", "processed", "high_fat"],
        "category": "fast food",
        "swap": "whole wheat paneer/egg sandwich with salad",
        "why": "Fast-food burgers often combine refined bun, sauces, and fried patties.",
    },
    "pizza": {
        "tags": ["refined_flour", "high_sodium", "high_fat"],
        "category": "fast food",
        "swap": "thin-crust veggie pizza + salad, or homemade roti pizza",
        "why": "Pizza can be high in refined flour, cheese fat, and sodium.",
    },
    "fries": {
        "tags": ["fried", "high_sodium", "high_fat"],
        "category": "fried side",
        "swap": "air-fried potato wedges / roasted chana / salad bowl",
        "why": "Fries add oil, salt, and calories without much satiety.",
    },
    "french fries": {
        "tags": ["fried", "high_sodium", "high_fat"],
        "category": "fried side",
        "swap": "air-fried potato wedges / roasted makhana",
        "why": "Fries add oil, salt, and calories without much satiety.",
    },
    "coke": {
        "tags": ["high_sugar", "sugary_drink"],
        "category": "sugary drink",
        "swap": "nimbu pani without sugar / chaas / coconut water",
        "why": "Sugary drinks add quick sugar without fullness.",
    },
    "cold drink": {
        "tags": ["high_sugar", "sugary_drink"],
        "category": "sugary drink",
        "swap": "chaas / unsweetened lemon water / plain soda with lemon",
        "why": "Sugary drinks can increase daily sugar intake very fast.",
    },
    "cola": {
        "tags": ["high_sugar", "sugary_drink"],
        "category": "sugary drink",
        "swap": "plain soda + lemon + salt in moderation",
        "why": "Cola usually contains high added sugar.",
    },
    "biryani": {
        "tags": ["high_calorie", "high_sodium", "low_fiber_if_no_salad"],
        "category": "rice meal",
        "swap": "smaller biryani portion + raita + salad + protein-first serving",
        "why": "Large portions can be calorie-dense; balance with curd and salad.",
    },
    "chowmein": {
        "tags": ["refined_flour", "high_sodium", "processed_sauce"],
        "category": "street food",
        "swap": "homemade atta noodles with vegetables and paneer/tofu/egg",
        "why": "Street-style noodles often have refined noodles and salty sauces.",
    },
    "momos": {
        "tags": ["refined_flour", "low_protein", "spicy_sauce"],
        "category": "street food",
        "swap": "wheat momos / steamed paneer momos + less red chutney",
        "why": "Maida covering and spicy sauce can be an issue if eaten frequently.",
    },
    "gulab jamun": {
        "tags": ["high_sugar", "dessert", "high_fat"],
        "category": "sweet",
        "swap": "fruit curd bowl / dates + nuts in small portion",
        "why": "Indian sweets combine sugar and fat; portion control matters.",
    },
    "ice cream": {
        "tags": ["high_sugar", "dessert", "high_fat"],
        "category": "dessert",
        "swap": "curd + fruit bowl / frozen banana yogurt",
        "why": "Ice cream can add sugar and saturated fat.",
    },
    "chips": {
        "tags": ["fried", "high_sodium", "processed"],
        "category": "packaged snack",
        "swap": "roasted chana / makhana / peanuts in controlled quantity",
        "why": "Packaged chips are usually salty, fried, and easy to overeat.",
    },
    "biscuits": {
        "tags": ["refined_flour", "added_sugar", "palm_oil"],
        "category": "packaged snack",
        "swap": "peanuts, fruit, homemade chilla, roasted makhana",
        "why": "Many biscuits contain refined flour, sugar, and palm oil.",
    },
}

ADDITIVE_KB = {
    "ins 621": {
        "name": "MSG / Monosodium Glutamate",
        "purpose": "flavour enhancer - taste ko more savoury/umami banata hai",
        "simple": "Ye taste ko strong banane ke liye hota hai. Har kisi ke liye harmful nahi, but frequent packaged food ka signal ho sakta hai.",
        "concern": "medium",
        "alternative": "Natural flavour: roasted spices, garlic, onion, tomato, hing, jeera.",
    },
    "monosodium glutamate": {
        "name": "MSG / Monosodium Glutamate",
        "purpose": "flavour enhancer",
        "simple": "Taste ko zyada chatpata aur savoury banata hai. Main issue usually MSG alone nahi, balki full packaged-food pattern hota hai.",
        "concern": "medium",
        "alternative": "Homemade masala, herbs, roasted garlic/onion.",
    },
    "sodium benzoate": {
        "name": "Sodium Benzoate",
        "purpose": "preservative - product ko jaldi kharab hone se bachata hai",
        "simple": "Ye shelf life badhane ke liye hota hai. Frequent high-preservative foods kam rakhna better hota hai.",
        "concern": "medium",
        "alternative": "Fresh chutney/sauce, homemade drinks, shorter shelf-life products.",
    },
    "ins 211": {
        "name": "Sodium Benzoate",
        "purpose": "preservative",
        "simple": "Packet food ko longer shelf life dene ke liye add hota hai.",
        "concern": "medium",
        "alternative": "Fresh food or products with minimal preservatives.",
    },
    "palm oil": {
        "name": "Palm Oil",
        "purpose": "texture, frying stability, low-cost fat source",
        "simple": "Palm oil se product crispy/creamy aur cheap banta hai. Frequent intake se saturated fat load badh sakta hai.",
        "concern": "medium",
        "alternative": "Groundnut/mustard oil at home in controlled amount, nuts/seeds for fats.",
    },
    "refined wheat flour": {
        "name": "Refined Wheat Flour / Maida",
        "purpose": "soft texture and cheap base",
        "simple": "Maida jaldi digest hota hai aur fullness kam deta hai. Roz roz maida se protein/fiber intake low reh sakta hai.",
        "concern": "high",
        "alternative": "Whole wheat, millet, oats, dal-based batter.",
    },
    "maida": {
        "name": "Maida / Refined Flour",
        "purpose": "softness and structure",
        "simple": "Maida se product soft banta hai, but fiber low hota hai. Frequent maida habit long-term weight/sugar control ko affect kar sakti hai.",
        "concern": "high",
        "alternative": "Atta, millets, oats, besan, dal-based options.",
    },
    "maltodextrin": {
        "name": "Maltodextrin",
        "purpose": "thickener/filler, texture, sweetness support",
        "simple": "Ye processed carbohydrate hai. Label mein dikhe to product ka processing level high ho sakta hai.",
        "concern": "medium",
        "alternative": "Whole-food carbs like fruits, grains, dalia, oats.",
    },
    "high fructose corn syrup": {
        "name": "High Fructose Corn Syrup",
        "purpose": "sweetener",
        "simple": "Ye added sugar ka form hai. Regular sugary drinks/snacks mein sugar load badha sakta hai.",
        "concern": "high",
        "alternative": "Fruit sweetness, unsweetened drinks, jaggery also in moderation.",
    },
    "permitted synthetic food colour": {
        "name": "Synthetic Food Colour",
        "purpose": "colour/visual appeal",
        "simple": "Colour taste/nutrition ke liye nahi, sirf product ko attractive dikhane ke liye hota hai.",
        "concern": "medium",
        "alternative": "Natural colour from turmeric, beetroot, saffron, cocoa.",
    },
    "colour 150d": {
        "name": "Caramel Colour 150d",
        "purpose": "brown colour in drinks/sauces",
        "simple": "Ye colour ke liye hota hai, nutrition ke liye nahi. Cola-type products mein common hota hai.",
        "concern": "medium",
        "alternative": "Avoid coloured sugary drinks; choose water/chaas/lemon water.",
    },
    "acidity regulator": {
        "name": "Acidity Regulator",
        "purpose": "taste and pH control",
        "simple": "Isse khatta taste aur product stability control hoti hai. Alone issue nahi, but highly processed food ka signal ho sakta hai.",
        "concern": "low",
        "alternative": "Natural sourness: lemon, amchur, tomato, curd.",
    },
}

RISK_LIBRARY = {
    "high_sugar": {
        "severity": "high",
        "why": "Added sugar frequent ho to weight gain, cravings, dental issues, and blood-sugar control risk badh sakta hai.",
        "risk_area": "blood sugar and weight management",
    },
    "sugary_drink": {
        "severity": "high",
        "why": "Liquid sugar se calories quickly add hoti hain aur fullness nahi milti.",
        "risk_area": "blood sugar spikes and weight gain",
    },
    "high_sodium": {
        "severity": "medium",
        "why": "High sodium frequent ho to BP-sensitive people ke liye concern ho sakta hai.",
        "risk_area": "blood pressure and water retention",
    },
    "fried": {
        "severity": "medium",
        "why": "Fried food calorie-dense hota hai; frequent habit se weight and lipid profile risk badh sakta hai.",
        "risk_area": "weight and heart-health habits",
    },
    "refined_flour": {
        "severity": "medium",
        "why": "Refined flour fiber low hota hai, isliye fullness kam and cravings zyada ho sakti hain.",
        "risk_area": "digestion, satiety, and sugar control",
    },
    "processed": {
        "severity": "medium",
        "why": "Processed foods often combine salt, sugar, refined carbs, and fats.",
        "risk_area": "overall diet quality",
    },
    "low_protein": {
        "severity": "medium",
        "why": "Low protein meals se fullness kam and muscle/energy support weak ho sakta hai.",
        "risk_area": "satiety and muscle health",
    },
    "high_fat": {
        "severity": "medium",
        "why": "High-fat processed/fried items portion control ke bina calories badha dete hain.",
        "risk_area": "calorie balance and cholesterol-sensitive diets",
    },
}
