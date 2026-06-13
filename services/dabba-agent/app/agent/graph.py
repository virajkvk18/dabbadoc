from __future__ import annotations
import uuid
from typing import Any

from langgraph.graph import END, START, StateGraph

from app.core.schemas import AnalysisResponse
from .state import DabbaAgentState
from .utils import compact_profile, decode_base64_image
from .llm_clients import LLMRouter
from .prompts import (
    EXTRACTION_SYSTEM_PROMPT,
    ANALYSIS_SYSTEM_PROMPT,
    build_extraction_prompt,
    build_analysis_prompt,
)
from .scoring import (
    normalize_extracted_items,
    detect_ingredient_insights,
    score_items,
    build_risk_flags,
    build_future_risks,
    build_swaps,
    build_cost_comparison,
    seven_day_plan,
)


class DabbaAgent:
    def __init__(self) -> None:
        self.router = LLMRouter()
        self.graph = self._build_graph()

    def _build_graph(self):
        builder = StateGraph(DabbaAgentState)
        builder.add_node("preprocess", self.preprocess_node)
        builder.add_node("extract", self.extract_node)
        builder.add_node("score", self.score_node)
        builder.add_node("explain", self.explain_node)
        builder.add_node("finalize", self.finalize_node)

        builder.add_edge(START, "preprocess")
        builder.add_edge("preprocess", "extract")
        builder.add_edge("extract", "score")
        builder.add_edge("score", "explain")
        builder.add_edge("explain", "finalize")
        builder.add_edge("finalize", END)
        return builder.compile()

    def analyze(self, state: DabbaAgentState) -> AnalysisResponse:
        state.setdefault("request_id", str(uuid.uuid4()))
        state.setdefault("errors", [])
        result = self.graph.invoke(state)
        return AnalysisResponse.model_validate(result["final_response"])

    def preprocess_node(self, state: DabbaAgentState) -> dict[str, Any]:
        raw_text = state.get("raw_text") or ""
        analysis_type = state.get("analysis_type", "manual")
        image_bytes = decode_base64_image(state.get("image_base64"))

        if analysis_type == "manual" and not raw_text:
            raw_text = "Manual meal entry not provided in raw_text. Check request meals object."

        return {
            "preprocessed_text": raw_text.strip(),
            "image_bytes": image_bytes,
            "errors": state.get("errors", []),
        }

    def extract_node(self, state: DabbaAgentState) -> dict[str, Any]:
        user_profile = compact_profile(state.get("user_profile"))
        prompt = build_extraction_prompt(
            analysis_type=state.get("analysis_type", "manual"),
            preprocessed_text=state.get("preprocessed_text", ""),
            user_profile=user_profile,
            product_name=state.get("product_name"),
        )

        extracted, provider, fallback, errors = self.router.generate_json(
            EXTRACTION_SYSTEM_PROMPT,
            prompt,
            image_bytes=state.get("image_bytes"),
            image_base64=state.get("image_base64"),
            mime_type=state.get("mime_type") or "image/jpeg",
        )

        # Local fallback normalization makes the agent still useful without API.
        normalized_items = normalize_extracted_items(extracted, state.get("preprocessed_text", ""))
        local_ingredients = detect_ingredient_insights(state.get("preprocessed_text", ""))
        extracted.setdefault("detected_items", normalized_items)
        extracted.setdefault("ingredient_insights", local_ingredients)

        return {
            "extracted": extracted,
            "model_provider": provider,
            "fallback_used": fallback,
            "errors": state.get("errors", []) + errors,
        }

    def score_node(self, state: DabbaAgentState) -> dict[str, Any]:
        extracted = state.get("extracted", {})
        items = normalize_extracted_items(extracted, state.get("preprocessed_text", ""))

        # Merge LLM ingredient insights with local additive knowledge.
        ingredient_insights = extracted.get("ingredient_insights") or []
        local_insights = detect_ingredient_insights(state.get("preprocessed_text", ""))
        known = {str(i.get("ingredient", "")).lower() for i in ingredient_insights if isinstance(i, dict)}
        for insight in local_insights:
            if insight["ingredient"].lower() not in known:
                ingredient_insights.append(insight)

        scoring = score_items(items, ingredient_insights)
        flags = build_risk_flags(items, scoring)
        risks = build_future_risks(flags)
        swaps = build_swaps(items)
        cost = build_cost_comparison(swaps)

        scoring.update(
            {
                "items": items,
                "ingredient_insights": ingredient_insights,
                "risk_flags": flags,
                "future_health_risks": risks,
                "healthier_swaps": swaps,
                "cost_comparison": cost,
                "seven_day_action_plan": seven_day_plan(),
            }
        )
        return {"scoring": scoring}

    def explain_node(self, state: DabbaAgentState) -> dict[str, Any]:
        user_profile = compact_profile(state.get("user_profile"))
        prompt = build_analysis_prompt(
            analysis_type=state.get("analysis_type", "manual"),
            extracted=state.get("extracted", {}),
            scoring=state.get("scoring", {}),
            language=state.get("language", "hinglish"),
            user_profile=user_profile,
            raw_text=state.get("preprocessed_text"),
        )

        llm_analysis, provider, fallback, errors = self.router.generate_json(
            ANALYSIS_SYSTEM_PROMPT,
            prompt,
            image_bytes=None,
            image_base64=None,
            mime_type=state.get("mime_type") or "image/jpeg",
        )

        # If explanation LLM fails, build deterministic response.
        if not llm_analysis:
            scoring = state.get("scoring", {})
            llm_analysis = {
                "hinglish_explanation": "Is food pattern mein kuch warning signals dikh rahe hain. Kabhi-kabhi okay hai, but agar ye roz ya frequently habit ban jaye to sugar, sodium, fried/refined carbs aur low protein jaise issues long-term health goals ko affect kar sakte hain.",
                "risk_flags": scoring.get("risk_flags", []),
                "future_health_risks": scoring.get("future_health_risks", []),
                "ingredient_insights": scoring.get("ingredient_insights", []),
                "healthier_swaps": scoring.get("healthier_swaps", []),
                "cost_comparison": scoring.get("cost_comparison", []),
                "seven_day_action_plan": scoring.get("seven_day_action_plan", seven_day_plan()),
                "family_tip": "Family mein ek simple rule rakho: packet/order food ke saath protein + salad/curd add karo aur sugary drink avoid karo.",
            }

        return {
            "llm_analysis": llm_analysis,
            "model_provider": provider if provider != "local_rules" else state.get("model_provider", provider),
            "fallback_used": bool(state.get("fallback_used") or fallback),
            "errors": state.get("errors", []) + errors,
        }

    def finalize_node(self, state: DabbaAgentState) -> dict[str, Any]:
        scoring = state.get("scoring", {})
        llm = state.get("llm_analysis", {})
        items = scoring.get("items", [])

        final = {
            "request_id": state.get("request_id"),
            "analysis_type": state.get("analysis_type", "manual"),
            "model_provider": state.get("model_provider", "unknown"),
            "fallback_used": bool(state.get("fallback_used", False)),
            "dabba_health_index": {
                "score": int(scoring.get("score", 50)),
                "grade": scoring.get("grade", "Moderate"),
                "summary": scoring.get("summary", "Food pattern analyzed."),
            },
            "detected_items": items,
            "ingredient_insights": llm.get("ingredient_insights") or scoring.get("ingredient_insights", []),
            "risk_flags": llm.get("risk_flags") or scoring.get("risk_flags", []),
            "future_health_risks": llm.get("future_health_risks") or scoring.get("future_health_risks", []),
            "hinglish_explanation": llm.get("hinglish_explanation") or "Food pattern analyzed in simple Hinglish.",
            "healthier_swaps": llm.get("healthier_swaps") or scoring.get("healthier_swaps", []),
            "cost_comparison": llm.get("cost_comparison") or scoring.get("cost_comparison", []),
            "seven_day_action_plan": llm.get("seven_day_action_plan") or scoring.get("seven_day_action_plan", seven_day_plan()),
            "family_tip": llm.get("family_tip") or "Weekly food pattern check karo, sirf ek meal nahi.",
            "disclaimer": "Educational food insight only. This is not medical diagnosis or a replacement for a doctor/dietitian.",
            "raw_debug": {
                "errors": state.get("errors", []),
                "tag_counts": scoring.get("tag_counts", {}),
            },
        }
        return {"final_response": final}
