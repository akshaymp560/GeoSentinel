from typing import Dict, Any, List
from agents.spectral_agents import SpectralEvidenceAgent
from agents.environmental_agents import (
    WeatherAgent, ElevationAgent, FireAgent, LandCoverAgent, NewsAgent
)


class EvidenceFusionEngine:
    """
    Collects findings from the agent swarm, checks for corroboration,
    and calculates multi-hypothesis causal attribution.
    """
    def __init__(self):
        self.weather_agent = WeatherAgent()
        self.elevation_agent = ElevationAgent()
        self.fire_agent = FireAgent()
        self.landcover_agent = LandCoverAgent()
        self.news_agent = NewsAgent()

    def fuse_evidence(
        self,
        bbox: List[float],
        pre_geotiff: str,
        post_geotiff: str,
        mask_geotiff: str,
        pre_date: str,
        post_date: str,
        analytics: Dict[str, Any]
    ) -> Dict[str, Any]:
        center_lon = (bbox[0] + bbox[2]) / 2.0
        center_lat = (bbox[1] + bbox[3]) / 2.0

        # 1. Spectral Agent (Raster Inspection)
        spectral_agent = SpectralEvidenceAgent(pre_geotiff, post_geotiff, mask_geotiff)
        spectral_findings = spectral_agent.analyze()

        # 2. Environmental & Media Swarm
        weather_findings = self.weather_agent.investigate(center_lat, center_lon, pre_date, post_date)
        elevation_findings = self.elevation_agent.investigate(bbox)
        fire_findings = self.fire_agent.investigate(bbox, post_date)
        landcover_findings = self.landcover_agent.investigate(bbox)
        news_findings = self.news_agent.investigate(aoi_hint="Wayanad", disaster_type="landslide")

        # 3. Weighted Multi-Hypothesis Attribution Modeling
        landslide_weight = 0.0
        deforestation_weight = 0.0
        wildfire_weight = 0.0

        # Meteorological Trigger
        if weather_findings.get("metrics", {}).get("cloudburst_threshold_exceeded"):
            landslide_weight += 0.35
        if weather_findings.get("metrics", {}).get("soil_saturation_alert"):
            landslide_weight += 0.15

        # Topographic Relief
        if elevation_findings.get("metrics", {}).get("slope_failure_susceptible"):
            landslide_weight += 0.25

        # Spectral Signatures
        delta_ndvi = spectral_findings.get("vegetation_agent", {}).get("delta_ndvi_mean", 0.0)
        if delta_ndvi < -0.10:
            landslide_weight += 0.15
            deforestation_weight += 0.35

        # Fire Elimination / Corroboration
        if fire_findings.get("metrics", {}).get("wildfire_ruled_out", True):
            wildfire_weight = 0.0
        else:
            wildfire_weight += 0.80

        # Absence of rain + canopy loss implies logging
        if not weather_findings.get("metrics", {}).get("cloudburst_threshold_exceeded") and delta_ndvi < -0.15:
            deforestation_weight += 0.40

        scores = {
            "Landslide / Debris Flow": round(min(landslide_weight, 0.99), 2),
            "Commercial Deforestation": round(min(deforestation_weight, 0.99), 2),
            "Wildfire Burn": round(min(wildfire_weight, 0.99), 2)
        }

        primary_hypothesis = max(scores, key=scores.get)

        return {
            "fusion_status": "COMPLETED",
            "spatial_footprint": {
                "bbox": bbox,
                "centroid": {"lat": round(center_lat, 4), "lon": round(center_lon, 4)},
                "disturbed_ha": analytics.get("estimated_change_ha"),
                "change_pct": analytics.get("change_percentage")
            },
            "agent_evidence_dossier": {
                "spectral_agent": spectral_findings,
                "weather_agent": weather_findings,
                "elevation_agent": elevation_findings,
                "fire_agent": fire_findings,
                "landcover_agent": landcover_findings,
                "news_agent": news_findings
            },
            "causal_attribution": {
                "primary_hypothesis": primary_hypothesis,
                "confidence": scores[primary_hypothesis],
                "hypothesis_distribution": scores
            }
        }