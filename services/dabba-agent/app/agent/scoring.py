from __future__ import annotations
from collections import Counter
from .knowledge_base import FOOD_RULES, ADDITIVE_KB, RISK_LIBRARY


def _norm(text: str) -> str:
    return (text or "").strip().lower()


def detect_food_items(text: str) -> list[dict]:
    """Keyword-based fallback extractor for common Indian/western items."""
    lowered = _norm(text)
    found: list[dict] = []
    for key, data in FOOD_RULES.items():
        if key in lowered:
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
                "evidence": evidence_by_tag.get(tag, [])[:5],
            }
        )
    return flags[:8]


def build_future_risks(flags: list[dict]) -> list[dict]:
    risks: list[dict] = []
    used = set()
    for flag in flags:
        key = flag["flag"].lower()
        if "sugar" in key and "blood sugar" not in used:
            used.add("blood sugar")
            risks.append(
                {
                    "risk_area": "Blood sugar and cravings",
                    "simple_reason": "Added sugar ya sugary drinks daily habit banne par sugar spikes aur cravings badh sakte hain.",
                    "confidence": "medium",
                    "prevention_tip": "Sugary drink ko chaas, nimbu pani without sugar, ya water se replace karo.",
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
                }
            )
        if ("fried" in key or "fat" in key) and "weight" not in used:
            used.add("weight")
            risks.append(
                {
                    "risk_area": "Weight and heart-health habits",
                    "simple_reason": "Fried foods calorie-dense hote hain; frequent habit se calorie surplus easy ho jata hai.",
                    "confidence": "medium",
                    "prevention_tip": "Fried snack ko roasted/steamed option se replace karo at least 4 days/week.",
                }
            )
        if "refined" in key and "fiber" not in used:
            used.add("fiber")
            risks.append(
                {
                    "risk_area": "Low fiber and poor fullness",
                    "simple_reason": "Maida/refined carbs se fiber kam milta hai, fullness kam hoti hai aur overeating chances badhte hain.",
                    "confidence": "medium",
                    "prevention_tip": "Atta, dal, sprouts, vegetables, curd ya salad add karo.",
                }
            )
    return risks[:5]


def build_swaps(items: list[dict]) -> list[dict]:
    swaps: list[dict] = []
    for item in items:
        lname = _norm(item.get("name", ""))
        for key, data in FOOD_RULES.items():
            if key in lname:
                swaps.append(
                    {
                        "replace": item.get("name", key.title()),
                        "with_item": data["swap"],
                        "why_better": data["why"],
                        "indian_context": "Indian family friendly, easy to make or order in most cities.",
                    }
                )
                break
    return swaps[:8]


def build_cost_comparison(swaps: list[dict]) -> list[dict]:
    rows = []
    for swap in swaps[:6]:
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
