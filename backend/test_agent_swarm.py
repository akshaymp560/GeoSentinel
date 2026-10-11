import os
import sys
import json

# Ensure backend root is always on sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from fusion.evidence_fusion import EvidenceFusionEngine

def test_swarm():
    print("=== Testing GeoSentinel-AI Multi-Agent Evidence Swarm ===")
    
    # Path to verified job_505f8410 from Phase 5
    base_run = r"D:\A2026\capstone\GeoSentinel-AI\model\ChangeFormer\data\runs\job_505f8410"
    pre_tif = os.path.join(base_run, "pre_2024-02-05.tif")
    post_tif = os.path.join(base_run, "post_2024-12-16.tif")
    mask_tif = os.path.join(base_run, "change_mask.tif")

    bbox = [76.15, 11.51, 76.18, 11.54]
    pre_date = "2024-02-05"
    post_date = "2024-12-16"
    analytics = {"estimated_change_ha": 7.81, "change_percentage": 0.7107}

    engine = EvidenceFusionEngine()
    print("Executing all agents across spatial and contextual modalities...")
    
    fused = engine.fuse_evidence(
        bbox=bbox,
        pre_geotiff=pre_tif,
        post_geotiff=post_tif,
        mask_geotiff=mask_tif,
        pre_date=pre_date,
        post_date=post_date,
        analytics=analytics
    )

    print("\n=== FUSED EVIDENCE DOSSIER ===")
    print(json.dumps(fused, indent=2))

if __name__ == "__main__":
    test_swarm()