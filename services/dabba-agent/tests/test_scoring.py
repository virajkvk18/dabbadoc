from app.agent.scoring import detect_food_items, detect_ingredient_insights, score_items, build_risk_flags


def test_detect_common_foods():
    items = detect_food_items("2 samosa, chowmein and cold drink")
    names = {i["name"].lower() for i in items}
    assert "samosa" in names
    assert "chowmein" in names
    assert "cold drink" in names


def test_detect_ingredients():
    insights = detect_ingredient_insights("refined wheat flour, palm oil, flavour enhancer INS 621")
    names = {i["ingredient"].lower() for i in insights}
    assert any("maida" in n or "refined" in n for n in names)
    assert any("palm" in n for n in names)
    assert any("msg" in n or "monosodium" in n for n in names)


def test_score_penalty():
    items = detect_food_items("samosa cold drink french fries")
    scoring = score_items(items)
    assert scoring["score"] < 80
    flags = build_risk_flags(items, scoring)
    assert len(flags) > 0
