from typing import Any, Literal, TypedDict


class DabbaAgentState(TypedDict, total=False):
    request_id: str
    analysis_type: Literal["manual", "receipt", "label"]
    language: str
    source_type: str
    product_name: str | None
    user_profile: dict[str, Any] | None
    raw_text: str | None
    image_base64: str | None
    image_bytes: bytes | None
    mime_type: str | None
    preprocessed_text: str
    extracted: dict[str, Any]
    scoring: dict[str, Any]
    llm_analysis: dict[str, Any]
    final_response: dict[str, Any]
    model_provider: str
    fallback_used: bool
    errors: list[str]
