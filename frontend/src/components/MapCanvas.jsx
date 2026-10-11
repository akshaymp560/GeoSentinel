import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

export default function MapCanvas({ bbox }) {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'esri-satellite': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            attribution: 'Esri World Imagery'
          }
        },
        layers: [
          {
            id: 'satellite-layer',
            type: 'raster',
            source: 'esri-satellite',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: bbox?.length === 4 ? [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2] : [0, 0],
      zoom: bbox?.length === 4 ? 11 : 2,
      pitch: 45, // 3D perspective angle
      bearing: -10
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      map.current.addSource('aoi-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      map.current.addLayer({
        id: 'aoi-fill',
        type: 'fill',
        source: 'aoi-source',
        paint: {
          'fill-color': '#0284c7',
          'fill-opacity': 0.22
        }
      });

      map.current.addLayer({
        id: 'aoi-line',
        type: 'line',
        source: 'aoi-source',
        paint: {
          'line-color': '#38bdf8',
          'line-width': 2.5,
          'line-dasharray': [2, 1]
        }
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current || !bbox || bbox.length !== 4) return;

    const [minLon, minLat, maxLon, maxLat] = bbox;

    const polygonFeature = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [minLon, minLat],
            [maxLon, minLat],
            [maxLon, maxLat],
            [minLon, maxLat],
            [minLon, minLat]
          ]
        ]
      }
    };

    const updateSource = () => {
      const src = map.current.getSource('aoi-source');
      if (src) {
        src.setData({
          type: 'FeatureCollection',
          features: [polygonFeature]
        });
      }

      map.current.fitBounds(
        [
          [minLon, minLat],
          [maxLon, maxLat]
        ],
        {
          padding: 80,
          duration: 1800,
          pitch: 50,
          essential: true
        }
      );
    };

    if (map.current.isStyleLoaded()) {
      updateSource();
    } else {
      map.current.once('load', updateSource);
    }
  }, [bbox]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

    </div>
  );
}
