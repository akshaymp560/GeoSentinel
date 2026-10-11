import os
import rasterio
import numpy as np
from PIL import Image


def generate_rgb_preview(geotiff_path: str, output_png_path: str) -> str:
    """
    Extracts Bands 3, 2, 1 (Red, Green, Blue from B2, B3, B4, B8 stack)
    and saves a contrast-stretched 8-bit RGB PNG preview.
    """
    with rasterio.open(geotiff_path) as src:
        # Band indices in our 4-band stack: Band 1=B2, Band 2=B3, Band 3=B4, Band 4=B8
        r = src.read(3).astype(np.float32)
        g = src.read(2).astype(np.float32)
        b = src.read(1).astype(np.float32)

    rgb = np.stack([r, g, b], axis=-1)

    # 2% - 98% percentile contrast stretch
    p2 = np.percentile(rgb, 2)
    p98 = np.percentile(rgb, 98)
    if p98 - p2 > 1e-4:
        rgb_stretched = np.clip((rgb - p2) / (p98 - p2), 0.0, 1.0)
    else:
        rgb_stretched = np.clip(rgb / 255.0, 0.0, 1.0)

    rgb_uint8 = (rgb_stretched * 255).astype(np.uint8)
    img = Image.fromarray(rgb_uint8, mode="RGB")
    os.makedirs(os.path.dirname(os.path.abspath(output_png_path)), exist_ok=True)
    img.save(output_png_path, format="PNG")
    return output_png_path


def generate_mask_overlay(mask_path: str, output_png_path: str) -> str:
    """
    Converts binary 0/1 change mask GeoTIFF into an RGBA transparent PNG.
    0 (Stable ground) -> Completely Transparent
    1 (Disturbed ground) -> High-contrast Red with slight opacity
    """
    with rasterio.open(mask_path) as src:
        mask = src.read(1)

    h, w = mask.shape
    rgba = np.zeros((h, w, 4), dtype=np.uint8)

    # Flagged change pixels: Bright Red [R=255, G=30, B=30, Alpha=210]
    changed = (mask == 1)
    rgba[changed] = [255, 30, 30, 210]

    img = Image.fromarray(rgba, mode="RGBA")
    os.makedirs(os.path.dirname(os.path.abspath(output_png_path)), exist_ok=True)
    img.save(output_png_path, format="PNG")
    return output_png_path

import base64

def generate_triptych_preview(pre_png_path: str, post_png_path: str, mask_png_path: str, output_path: str) -> str:
    """
    Stitches Pre-RGB, Post-RGB, and Change Overlay side-by-side
    into a single 3-panel reference strip for the Vision LLM.
    """
    img_pre = Image.open(pre_png_path).convert("RGB")
    img_post = Image.open(post_png_path).convert("RGB")
    img_mask = Image.open(mask_png_path).convert("RGBA")

    # Composite mask directly over the post image so the red scar is geographically anchored
    combined_mask = img_post.copy().convert("RGBA")
    combined_mask.alpha_composite(img_mask)
    combined_mask = combined_mask.convert("RGB")

    w, h = img_pre.size
    triptych = Image.new("RGB", (w * 3, h), (0, 0, 0))
    triptych.paste(img_pre, (0, 0))
    triptych.paste(img_post, (w, 0))
    triptych.paste(combined_mask, (w * 2, 0))

    triptych.save(output_path, format="PNG")
    return output_path


def encode_image_to_base64(image_path: str) -> str:
    """Encodes a PNG to base64 for multimodal OpenAI/OpenRouter payloads."""
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")