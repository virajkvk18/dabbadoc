from typing import Any, Literal
from pydantic import BaseModel, Field

Language = Literal["hinglish", "english", "hindi"]
AnalysisType = Literal["manual", "receipt", "label"]
SourceType = Literal["grocery", "restaurant", "food_delivery", "ecommerce", "home", "unknown"]


class UserProfile(BaseModel):
    age_group: str | None = Field(default=None, description="child, adult, senior, family, etc.")
    diet_type: str | None = Field(default=None, description="veg, non-veg, vegan, Jain, mixed, etc.")
    goals: list[str] = Field(default_factory=list)
    restrictions: list[str] = Field(default_factory=list)
    notes: str | None = None


class ManualMeal(BaseModel):
    meal_name: str = "Meal"
    items: list[str] = Field(default_factory=list)
    quantity_note: str | None = None
    spice_level: str | None = None
    meal_source: SourceType = "home"
    notes: str | None = None


class BaseAnalysisRequest(BaseModel):
    language: Language = "hinglish"
    user_profile: UserProfile | None = None


class ManualMealRequest(BaseAnalysisRequest):
    meals: list[ManualMeal]
    raw_text: str | None = None


class ReceiptScanRequest(BaseAnalysisRequest):
    source_type: SourceType = "unknown"
    raw_text: str | None = Field(default=None, description="OCR text, pasted bill text, or order history text")
    image_base64: str | None = Field(default=None, description="Base64 encoded image without or with data URL prefix")
    mime_type: str = "image/jpeg"


class LabelScanRequest(BaseAnalysisRequest):
    product_name: str | None = None
    raw_text: str | None = Field(default=None, description="OCR text or pasted ingredient/nutrition text")
    image_base64: str | None = None
    mime_type: str = "image/jpeg"


class DabbaHealthIndex(BaseModel):
    score: int = Field(ge=0, le=100)
    grade: str
    summary: str


class DetectedItem(BaseModel):
    name: str
    quantity: str | None = None
    category: str | None = None
    confidence: float | None = Field(default=None, ge=0, le=1)
    risk_tags: list[str] = Field(default_factory=list)


class RiskFlag(BaseModel):
    flag: str
    severity: Literal["low", "medium", "high"] = "medium"
    why_it_matters: str
    evidence: list[str] = Field(default_factory=list)


class FutureRisk(BaseModel):
    risk_area: str
    simple_reason: str
    confidence: Literal["low", "medium", "high"] = "medium"
    prevention_tip: str


class HealthierSwap(BaseModel):
    replace: str
    with_item: str
    why_better: str
    indian_context: str | None = None


class CostComparison(BaseModel):
    current_choice: str
    better_choice: str
    estimated_cost_relation: Literal["cheaper", "similar", "slightly_higher", "higher", "unknown"] = "unknown"
    note: str


class SevenDayAction(BaseModel):
    day: int = Field(ge=1, le=7)
    action: str
    difficulty: Literal["easy", "medium", "hard"] = "easy"


class IngredientInsight(BaseModel):
    ingredient: str
    purpose_in_food: str
    simple_hinglish_explanation: str
    concern_level: Literal["low", "medium", "high", "unknown"] = "unknown"
    natural_or_better_alternative: str | None = None


class AnalysisResponse(BaseModel):
    request_id: str
    analysis_type: AnalysisType
    model_provider: str
    fallback_used: bool = False
    dabba_health_index: DabbaHealthIndex
    detected_items: list[DetectedItem] = Field(default_factory=list)
    ingredient_insights: list[IngredientInsight] = Field(default_factory=list)
    risk_flags: list[RiskFlag] = Field(default_factory=list)
    future_health_risks: list[FutureRisk] = Field(default_factory=list)
    hinglish_explanation: str
    healthier_swaps: list[HealthierSwap] = Field(default_factory=list)
    cost_comparison: list[CostComparison] = Field(default_factory=list)
    seven_day_action_plan: list[SevenDayAction] = Field(default_factory=list)
    family_tip: str
    disclaimer: str = "Educational food insight only. This is not medical diagnosis or a replacement for a doctor/dietitian."
    raw_debug: dict[str, Any] = Field(default_factory=dict)


class PDFReportRequest(BaseModel):
    title: str = "DabbaDoc Food Health Report"
    analysis: AnalysisResponse | dict[str, Any]


class PDFReportResponse(BaseModel):
    filename: str
    mime_type: str = "application/pdf"
    base64_pdf: str
