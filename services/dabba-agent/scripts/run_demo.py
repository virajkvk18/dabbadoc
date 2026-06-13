from __future__ import annotations
import json
from pathlib import Path

from app.agent.graph import DabbaAgent


def main():
    agent = DabbaAgent()
    example_path = Path(__file__).resolve().parents[1] / "examples" / "label_scan.json"
    payload = json.loads(example_path.read_text(encoding="utf-8"))

    response = agent.analyze(
        {
            "analysis_type": "label",
            "language": payload["language"],
            "product_name": payload.get("product_name"),
            "raw_text": payload.get("raw_text"),
            "image_base64": payload.get("image_base64"),
            "mime_type": payload.get("mime_type", "image/jpeg"),
            "user_profile": payload.get("user_profile"),
            "source_type": "ecommerce",
        }
    )
    print(response.model_dump_json(indent=2))


if __name__ == "__main__":
    main()
