import os
import sys
import json

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from visualizer import generate_triptych_preview, encode_image_to_base64
from fusion.evidence_fusion import EvidenceFusionEngine
from services.qwen_service import QwenMultimodalReasoningService

def run_test():
    print("=== Testing Phase 7: Multimodal Reasoning (Satellite Strip + Agent Swarm) ===")

    job_dir = r"D:\A2026\capstone\GeoSentinel-AI\model\ChangeFormer\data\runs\job_505f8410"
    pre_png = os.path.join(job_dir, "pre_preview.png")
    post_png = os.path.join(job_dir, "post_preview.png")
    mask_png = os.path.join(job_dir, "change_overlay.png")
    triptych_path = os.path.join(job_dir, "triptych_preview.png")

    # 1. Generate the 3-panel composite image
    print("1. Stitching 3-panel reference strip (Pre + Post + Change Mask)...")
    generate_triptych_preview(pre_png, post_png, mask_png, triptych_path)
    base64_img = encode_image_to_base64(triptych_path)
    print(f"   Saved to: {triptych_path} ({len(base64_img)} chars)")

    # 2. Run Evidence Fusion
    pre_tif = os.path.join(job_dir, "pre_2024-02-05.tif")
    post_tif = os.path.join(job_dir, "post_2024-12-16.tif")
    mask_tif = os.path.join(job_dir, "change_mask.tif")

    detection_payload = {
        "metadata": {
            "bbox": [76.15, 11.51, 76.18, 11.54],
            "pre_acquisition_date": "2024-02-05",
            "post_acquisition_date": "2024-12-16"
        },
        "analytics": {
            "estimated_change_ha": 7.81,
            "change_percentage": 0.7107,
            "changed_pixels": 781
        }
    }

    print("2. Fusing multi-agent evidence...")
    fusion = EvidenceFusionEngine()
    evidence = fusion.fuse_evidence(
        bbox=detection_payload["metadata"]["bbox"],
        pre_geotiff=pre_tif,
        post_geotiff=post_tif,
        mask_geotiff=mask_tif,
        pre_date=detection_payload["metadata"]["pre_acquisition_date"],
        post_date=detection_payload["metadata"]["post_acquisition_date"],
        analytics=detection_payload["analytics"]
    )

    # 3. Multimodal Reasoning Call
    print("3. Executing Multimodal Intelligence Engine...")
    service = QwenMultimodalReasoningService()
    dossier = service.generate_dossier(
        detection=detection_payload,
        evidence=evidence,
        triptych_base64=base64_img
    )

    print("\n=== VALIDATED MULTIMODAL DOSSIER (JSON) ===")
    print(json.dumps(dossier.model_dump(exclude={"report_markdown"}), indent=2))

    print("\n=== GENERATED INTELLIGENCE REPORT ===")
    print(dossier.report_markdown)

if __name__ == "__main__":
    run_test()