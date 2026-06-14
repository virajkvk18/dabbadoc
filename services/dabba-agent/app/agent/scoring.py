from __future__ import annotations
from collections import Counter
from .knowledge_base import FOOD_RULES, ADDITIVE_KB, RISK_LIBRARY


def _norm(text: str) -> str:
    return (text or "").strip().lower()


def detect_food_items(text: str) -> list[dict]:
    """Keyword-based fallback extractor for common Indian/western items."""
    lowered = _norm(text)
    found: list[dict] = []
    for key, data in sorted(FOOD_RULES.items(), key=lambda row: len(row[0]), reverse=True):
        if key in lowered:
            if any(key in _norm(item.get("name", "")) or _norm(item.get("name", "")) in key for item in found):
                continue
            found.append(
                {
                    "name": key.title(),
                    "quantity": None,
                    "category": data.get("category"),
                    "confidence": 0.65,
                    "risk_tags": data.get("tags", []),
                    "swap": data.get("swap"),
                    "why": data.get("why"),
                }
            )
    return found


def detect_ingredient_insights(text: str) -> list[dict]:
    lowered = _norm(text)
    insights: list[dict] = []
    seen = set()
    for key, data in ADDITIVE_KB.items():
        if key in lowered and data["name"] not in seen:
            seen.add(data["name"])
            insights.append(
                {
                    "ingredient": data["name"],
                    "purpose_in_food": data["purpose"],
                    "simple_hinglish_explanation": data["simple"],
                    "concern_level": data["concern"],
                    "natural_or_better_alternative": data["alternative"],
                }
            )
    return insights


def normalize_extracted_items(extracted: dict | None, text: str = "") -> list[dict]:
    extracted = extracted or {}
    items = extracted.get("detected_items") or extracted.get("foods") or []
    normalized: list[dict] = []

    for item in items:
        if isinstance(item, str):
            name = item
            risk_tags = []
            category = None
        elif isinstance(item, dict):
            name = item.get("name") or item.get("food") or item.get("item") or "Unknown item"
            risk_tags = item.get("risk_tags") or item.get("tags") or []
            category = item.get("category")
        else:
            continue

        rule = None
        lname = _norm(name)
        for key, data in FOOD_RULES.items():
            if key in lname:
                rule = data
                break

        normalized.append(
            {
                "name": str(name).title(),
                "quantity": item.get("quantity") if isinstance(item, dict) else None,
                "category": category or (rule or {}).get("category"),
                "confidence": item.get("confidence", 0.75) if isinstance(item, dict) else 0.65,
                "risk_tags": list(set(risk_tags + ((rule or {}).get("tags", [])))),
            }
        )

    # Add fallback items found in raw text, avoiding duplicates.
    fallback = detect_food_items(text)
    existing = {_norm(i["name"]) for i in normalized}
    for item in fallback:
        if _norm(item["name"]) not in existing:
            normalized.append(item)

    return normalized


def score_items(items: list[dict], ingredient_insights: list[dict] | None = None) -> dict:
    ingredient_insights = ingredient_insights or []
    tags = []
    for item in items:
        tags.extend(item.get("risk_tags", []))

    tag_counts = Counter(tags)
    score = 100
    penalty_map = {
        "high_sugar": 14,
        "sugary_drink": 16,
        "high_sodium": 12,
        "fried": 12,
        "refined_flour": 10,
        "processed": 10,
        "low_protein": 8,
        "high_fat": 8,
        "dessert": 8,
        "added_sugar": 10,
        "palm_oil": 7,
        "high_calorie": 8,
        "processed_sauce": 6,
        "spicy_sauce": 4,
        "low_fiber_if_no_salad": 5,
    }

    for tag, count in tag_counts.items():
        score -= penalty_map.get(tag, 4) * min(count, 3)

    # Ingredient/additive penalties.
    for ing in ingredient_insights:
        concern = ing.get("concern_level")
        if concern == "high":
            score -= 10
        elif concern == "medium":
            score -= 6
        elif concern == "low":
            score -= 2

    score = max(0, min(100, score))
    if score >= 80:
        grade = "Good"
        summary = "Overall choices look balanced, but still check portions and frequency."
    elif score >= 60:
        grade = "Moderate"
        summary = "Some warning signals are present. Better swaps can improve this meal pattern."
    elif score >= 40:
        grade = "Needs Attention"
        summary = "Frequent repetition of this pattern may increase long-term health risks."
    else:
        grade = "High Risk Pattern"
        summary = "This pattern has multiple high-risk signals like sugar, fried/refined, or sodium-heavy foods."

    return {
        "score": score,
        "grade": grade,
        "summary": summary,
        "tag_counts": dict(tag_counts),
    }


def build_risk_flags(items: list[dict], scoring: dict) -> list[dict]:
    flags: list[dict] = []
    tag_counts = scoring.get("tag_counts", {})
    evidence_by_tag: dict[str, list[str]] = {}
    for item in items:
        for tag in item.get("risk_tags", []):
            evidence_by_tag.setdefault(tag, []).append(item.get("name", "food item"))

    for tag, count in tag_counts.items():
        lib = RISK_LIBRARY.get(tag)
        if not lib:
            continue
        flags.append(
            {
                "flag": tag.replace("_", " ").title(),
                "severity": lib["severity"],
                "why_it_matters": lib["why"],
                "evidence": evidence_by_tag.get(tag, [])[:10],
            }
        )
    return flags


def build_future_risks(flags: list[dict]) -> list[dict]:
    risks: list[dict] = []
    used = set()
    for flag in flags:
        key = flag["flag"].lower()
        evidence = flag.get("evidence", [])
        if "sugar" in key and "blood sugar" not in used:
            used.add("blood sugar")
            risks.append(
                {
                    "risk_area": "Blood sugar, weight, and dental health",
                    "simple_reason": "Added sugar ya sugary drinks frequent habit banne par weight gain/obesity, sugar-control issues, cravings, aur tooth decay ka risk badh sakta hai.",
                    "confidence": "high",
                    "prevention_tip": "Sugary drink ko chaas, nimbu pani without sugar, ya water se replace karo.",
                    "habit_frequency": "Agar sugary items most days ya 4-5 din/week repeat hote hain.",
                    "linked_items": evidence,
                    "timeframe": "Single meal se disease predict nahi hoti; repeated months/years pattern important hota hai.",
                }
            )
        if ("sodium" in key or "processed" in key) and "bp" not in used:
            used.add("bp")
            risks.append(
                {
                    "risk_area": "Blood pressure-sensitive diet pattern",
                    "simple_reason": "High sodium packaged/restaurant foods frequent hone par BP-sensitive people ke liye concern ho sakta hai.",
                    "confidence": "medium",
                    "prevention_tip": "Packaged masala/sauces kam karo and salad/curd add karo.",
                    "habit_frequency": "Agar salty packaged ya restaurant foods week mein multiple times repeat hote hain.",
                    "linked_items": evidence,
                    "timeframe": "Weeks to months tak pattern repeat ho to monitor karna useful hai.",
                }
            )
        if ("fried" in key or "fat" in key) and "weight" not in used:
            used.add("weight")
            risks.append(
                {
                    "risk_area": "Weight and heart-health habits",
                    "simple_reason": "Fried foods calorie-dense hote hain; frequent habit se calorie surplus, weight gain, aur heart-health sensitive eating pattern ka risk badh sakta hai.",
                    "confidence": "medium",
                    "prevention_tip": "Fried snack ko roasted/steamed option se replace karo at least 4 days/week.",
                    "habit_frequency": "Agar fried snacks/side items 3-4 din/week ya daily repeat hote hain.",
                    "linked_items": evidence,
                    "timeframe": "Repeated habit over weeks/months matters more than one occasional treat.",
                }
            )
        if "refined" in key and "fiber" not in used:
            used.add("fiber")
            risks.append(
                {
                    "risk_area": "Low fiber and poor fullness",
                    "simple_reason": "Maida/refined carbs se fiber kam milta hai, fullness kam hoti hai aur cravings/overeating chances badhte hain.",
                    "confidence": "medium",
                    "prevention_tip": "Atta, dal, sprouts, vegetables, curd ya salad add karo.",
                    "habit_frequency": "Agar maida/refined-carb foods daily base banne lagte hain.",
                    "linked_items": evidence,
                    "timeframe": "Daily pattern over months is the main signal.",
                }
            )
    return risks


def _generic_swap_for_tags(item: dict) -> dict | None:
    tags = set(item.get("risk_tags", []))
    name = item.get("name", "Current item")

    if {"high_sugar", "sugary_drink", "added_sugar", "dessert"} & tags:
        return {
            "replace": name,
            "with_item": "chaas / unsweetened nimbu pani / fruit-curd bowl",
            "why_better": "Added sugar load kam hota hai aur fullness/hydration better milti hai.",
            "indian_context": "Indian homes and restaurants mein easy options.",
        }
    if {"fried", "high_fat"} & tags:
        return {
            "replace": name,
            "with_item": "roasted chana / makhana / sprouts chaat / steamed option",
            "why_better": "Oil and calorie load kam hota hai, protein/fiber balance better hota hai.",
            "indian_context": "Evening snack ya order side ke liye practical swap.",
        }
    if {"high_sodium", "processed", "processed_sauce"} & tags:
        return {
            "replace": name,
            "with_item": "poha with peanuts / oats upma / homemade chilla",
            "why_better": "Less processed, lower sodium, and better satiety for regular use.",
            "indian_context": "Quick Indian breakfast/snack format maintain hota hai.",
        }
    if {"refined_flour", "low_fiber_if_no_salad"} & tags:
        return {
            "replace": name,
            "with_item": "atta/millet/besan version with curd or salad",
            "why_better": "Fiber and fullness improve hoti hai compared with refined flour base.",
            "indian_context": "Roti pizza, besan chilla, atta roll, millet dosa jaise options use karo.",
        }
    if "low_protein" in tags:
        return {
            "replace": name,
            "with_item": "same meal plus dal, curd, paneer, egg, chana, tofu, or sprouts",
            "why_better": "Protein add hone se fullness and meal balance improve hota hai.",
            "indian_context": "Home or restaurant dono mein side protein add karna easiest hai.",
        }
    return None


def build_swaps(items: list[dict]) -> list[dict]:
    swaps: list[dict] = []
    seen = set()
    for item in items:
        lname = _norm(item.get("name", ""))
        swap = None
        for key, data in FOOD_RULES.items():
            if key in lname:
                swap = {
                    "replace": item.get("name", key.title()),
                    "with_item": data["swap"],
                    "why_better": data["why"],
                    "indian_context": "Indian family friendly, easy to make or order in most cities.",
                }
                break

        if not swap:
            swap = _generic_swap_for_tags(item)

        if not swap:
            continue

        key = (_norm(swap["replace"]), _norm(swap["with_item"]))
        if key in seen:
            continue
        seen.add(key)
        swaps.append(swap)
    return swaps


def build_cost_comparison(swaps: list[dict]) -> list[dict]:
    rows = []
    for swap in swaps:
        better = swap["with_item"]
        relation = "similar"
        if any(word in better.lower() for word in ["roasted", "chaas", "nimbu", "sprouts", "poha", "dalia"]):
            relation = "cheaper"
        elif any(word in better.lower() for word in ["paneer", "tofu", "egg"]):
            relation = "slightly_higher"
        rows.append(
            {
                "current_choice": swap["replace"],
                "better_choice": better,
                "estimated_cost_relation": relation,
                "note": "Approx estimate. Actual cost depends on city, brand, restaurant, and portion size.",
            }
        )
    return rows


def seven_day_plan() -> list[dict]:
    return [
        {"day": 1, "action": "Cold drink replace with water/chaas/nimbu pani without sugar.", "difficulty": "easy"},
        {"day": 2, "action": "Har main meal mein protein add karo: dal, paneer, egg, curd, chana, tofu.", "difficulty": "easy"},
        {"day": 3, "action": "Fried snack ko roasted makhana/chana/sprouts chaat se replace karo.", "difficulty": "easy"},
        {"day": 4, "action": "Packaged food label mein sugar, sodium, palm oil, maida check karo.", "difficulty": "medium"},
        {"day": 5, "action": "Dinner plate ka half part salad/sabzi/curd side se balance karo.", "difficulty": "easy"},
        {"day": 6, "action": "Restaurant order mein one high-risk item remove karo: fries/coke/dessert.", "difficulty": "medium"},
        {"day": 7, "action": "Weekly DabbaDoc report dekho and top 2 repeat junk items reduce karo.", "difficulty": "easy"},
    ]
