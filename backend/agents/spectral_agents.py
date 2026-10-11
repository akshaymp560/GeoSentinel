import rasterio
import numpy as np
from typing import Dict, Any


class SpectralEvidenceAgent:
    """
    Computes spectral index shifts (NDVI, NDWI, Surface Brightness)
    specifically masked inside the ChangeFormer disturbance footprint.
    """

    def __init__(self, pre_geotiff_path: str, post_geotiff_path: str, mask_geotiff_path: str):
        self.pre_path = pre_geotiff_path
        self.post_path = post_geotiff_path
        self.mask_path = mask_geotiff_path

    @staticmethod
    def _safe_normalized_diff(band1: np.ndarray, band2: np.ndarray) -> np.ndarray:
        denom = band1 + band2
        out = np.zeros_like(denom, dtype=np.float32)
        valid = (denom > 1e-5)
        out[valid] = (band1[valid] - band2[valid]) / denom[valid]
        return out

    def analyze(self) -> Dict[str, Any]:
        with rasterio.open(self.mask_path) as m_src:
            mask = m_src.read(1)  # 1 = Disturbance, 0 = Stable

        with rasterio.open(self.pre_path) as pre_src, rasterio.open(self.post_path) as post_src:
            # Bands: 1=B2 (Blue), 2=B3 (Green), 3=B4 (Red), 4=B8 (NIR)
            pre_green = pre_src.read(2).astype(np.float32)
            pre_red   = pre_src.read(3).astype(np.float32)
            pre_nir   = pre_src.read(4).astype(np.float32)

            post_green = post_src.read(2).astype(np.float32)
            post_red   = post_src.read(3).astype(np.float32)
            post_nir   = post_src.read(4).astype(np.float32)

        disturbed_indices = (mask == 1)
        total_disturbed_pixels = int(np.sum(disturbed_indices))

        if total_disturbed_pixels == 0:
            return {
                "status": "NO_CHANGE",
                "vegetation_loss": {"delta_ndvi_mean": 0.0, "interpretation": "No disturbance detected"},
                "water_inundation": {"delta_ndwi_mean": 0.0, "interpretation": "No water shifts detected"},
                "soil_exposure": {"delta_brightness_mean": 0.0, "interpretation": "Stable ground"}
            }

        # 1. Vegetation Agent: Normalized Difference Vegetation Index (NDVI)
        # NDVI = (NIR - Red) / (NIR + Red)
        pre_ndvi = self._safe_normalized_diff(pre_nir, pre_red)
        post_ndvi = self._safe_normalized_diff(post_nir, post_red)
        delta_ndvi = post_ndvi - pre_ndvi
        mean_delta_ndvi = float(np.mean(delta_ndvi[disturbed_indices]))

        # 2. Water / Moisture Agent: Normalized Difference Water Index (NDWI)
        # NDWI = (Green - NIR) / (Green + NIR)
        pre_ndwi = self._safe_normalized_diff(pre_green, pre_nir)
        post_ndwi = self._safe_normalized_diff(post_green, post_nir)
        delta_ndwi = post_ndwi - pre_ndwi
        mean_delta_ndwi = float(np.mean(delta_ndwi[disturbed_indices]))

        # 3. Bare Soil / Debris Disturbance Agent (Brightness Shift)
        pre_brightness = (pre_green + pre_red + pre_nir) / 3.0
        post_brightness = (post_green + post_red + post_nir) / 3.0
        delta_brightness = post_brightness - pre_brightness
        mean_delta_brightness = float(np.mean(delta_brightness[disturbed_indices]))

        # Qualitative Interpretations
        veg_status = "Severe Canopy Loss / Stripping" if mean_delta_ndvi < -0.15 else (
            "Moderate Vegetation Thinning" if mean_delta_ndvi < -0.05 else "Minimal Vegetation Impact"
        )
        water_status = "Water Accumulation / Saturated Mud" if mean_delta_ndwi > 0.1 else (
            "Possible Moisture Shift" if mean_delta_ndwi > 0.02 else "Dry Debris / No Inundation"
        )
        soil_status = "High Soil/Rock Scouring" if abs(mean_delta_brightness) > 150 else "Moderate Ground Exposure"

        return {
            "status": "ANALYZED",
            "sampled_pixels": total_disturbed_pixels,
            "vegetation_agent": {
                "mean_pre_ndvi": round(float(np.mean(pre_ndvi[disturbed_indices])), 4),
                "mean_post_ndvi": round(float(np.mean(post_ndvi[disturbed_indices])), 4),
                "delta_ndvi_mean": round(mean_delta_ndvi, 4),
                "signal": veg_status
            },
            "water_agent": {
                "mean_pre_ndwi": round(float(np.mean(pre_ndwi[disturbed_indices])), 4),
                "mean_post_ndwi": round(float(np.mean(post_ndwi[disturbed_indices])), 4),
                "delta_ndwi_mean": round(mean_delta_ndwi, 4),
                "signal": water_status
            },
            "land_disturbance_agent": {
                "mean_delta_brightness": round(mean_delta_brightness, 2),
                "signal": soil_status
            }
        }