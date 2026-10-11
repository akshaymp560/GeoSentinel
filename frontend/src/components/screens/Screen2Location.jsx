import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, LocateFixed, MapPin, Search, Trash2 } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as turf from '@turf/bbox';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { searchLocation } from '../../services/geocoding';
import { Button, Notice, PageFrame } from '../common/ui';

const KILOMETRES_PER_LATITUDE_DEGREE = 110.574;
const KILOMETRES_PER_LONGITUDE_DEGREE = 111.32;

function squareBboxAroundPoint(latitude, longitude, sizeKm = 2) {
  const halfSizeKm = sizeKm / 2;
  const latitudeRadians = (latitude * Math.PI) / 180;
  const halfLat = halfSizeKm / KILOMETRES_PER_LATITUDE_DEGREE;
  const longitudeScale = Math.max(Math.cos(latitudeRadians), 0.01);
  const halfLon = halfSizeKm / (KILOMETRES_PER_LONGITUDE_DEGREE * longitudeScale);

  return [longitude - halfLon, latitude - halfLat, longitude + halfLon, latitude + halfLat];
}

function polygonFromBbox([minLon, minLat, maxLon, maxLat]) {
  return {
    id: 'active-aoi',
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[[minLon, minLat], [maxLon, minLat], [maxLon, maxLat], [minLon, maxLat], [minLon, minLat]]],
    },
  };
}

export default function Screen2Location({ workflow, setWorkflow, navigateTo }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const draw = useRef(null);
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [locationLabel, setLocationLabel] = useState(workflow.aoi.name || 'No location selected');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aoiBbox, setAoiBbox] = useState(workflow.aoi.bbox || null);

  const updateAoi = useCallback(() => {
    const data = draw.current?.getAll();
    if (!data?.features?.length) return;

    const calculatedBbox = turf.bbox(data);
    setAoiBbox(calculatedBbox);
    setWorkflow(current => ({
      ...current,
      aoi: {
        ...current.aoi,
        bbox: calculatedBbox,
        centroid: `${((calculatedBbox[1] + calculatedBbox[3]) / 2).toFixed(5)}°N, ${((calculatedBbox[0] + calculatedBbox[2]) / 2).toFixed(5)}°E`,
        type: 'Rectangle',
      },
    }));
  }, [setWorkflow]);

  const clearAoi = useCallback(() => {
    setAoiBbox(null);
    setWorkflow(current => ({ ...current, aoi: { ...current.aoi, bbox: null, type: 'Rectangle' } }));
  }, [setWorkflow]);

  useEffect(() => {
    if (map.current || !mapContainer.current) return undefined;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          satellite: {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            attribution: 'Esri World Imagery',
          },
        },
        layers: [{ id: 'satellite', type: 'raster', source: 'satellite' }],
      },
      center: [0, 20],
      zoom: 1.5,
    });

    draw.current = new MapboxDraw({ displayControlsDefault: false });
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.addControl(draw.current, 'top-right');
    map.current.on('draw.create', updateAoi);
    map.current.on('draw.update', updateAoi);
    map.current.on('draw.delete', clearAoi);

    return () => {
      map.current?.remove();
      map.current = null;
      draw.current = null;
    };
  }, [clearAoi, updateAoi]);

  const applySearchResult = result => {
    const latitude = Number(result.lat);
    const longitude = Number(result.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setError('The geocoder returned an invalid coordinate. Try another location.');
      return;
    }

    const generatedBbox = squareBboxAroundPoint(latitude, longitude);
    const [minLon, minLat, maxLon, maxLat] = generatedBbox;
    setMatches([]);
    setQuery(result.name);
    setLocationLabel(result.displayName);
    setError('');

    if (!map.current || !draw.current) return;

    map.current.fitBounds([[minLon, minLat], [maxLon, maxLat]], { padding: 50, duration: 2000 });
    draw.current.deleteAll();
    draw.current.add(polygonFromBbox(generatedBbox));
    draw.current.changeMode('simple_select', { featureIds: ['active-aoi'] });
    updateAoi();
  };

  const findLocation = async event => {
    event.preventDefault();
    if (query.trim().length < 2) {
      setError('Enter at least two characters to search.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const results = await searchLocation(query);
      setMatches(results);
      if (!results.length) setError('No location found. Try a more specific search.');
      if (results[0]) applySearchResult(results[0]);
    } catch {
      setMatches([]);
      setError('Geocoding is unavailable. Try again or use the map controls.');
    } finally {
      setLoading(false);
    }
  };

  const valid = Array.isArray(aoiBbox) && aoiBbox.length === 4;
  return <PageFrame eyebrow="Investigation setup / 01" title="Define the area of interest" description="Search for a location to create a 2 km × 2 km editable rectangle. Resize its corners or edges over the exact target; the displayed bbox is the geometry sent to FastAPI." actions={<span className="font-mono text-xs text-zinc-600">AOI geometry: {valid ? 'READY' : 'REQUIRED'}</span>}><div className="grid overflow-hidden border border-border bg-surface lg:grid-cols-[360px_minmax(0,1fr)]"><aside className="border-b border-border p-5 lg:border-b-0 lg:border-r"><MapPin size={20} className="text-zinc-300" /><h2 className="mt-4 text-lg font-medium text-white">Choose a target</h2><form onSubmit={findLocation} className="relative mt-6 flex items-center rounded-lg border border-border bg-surface2 px-3"><Search size={16} className="mr-2 text-zinc-500" /><input value={query} onChange={event => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent py-3 text-sm text-white outline-none placeholder:text-zinc-600" placeholder="Search Nileshwar, Kerala" aria-label="Search location" /><button type="submit" className="text-zinc-500 hover:text-white" aria-label="Search"><LocateFixed size={16} /></button>{matches.length > 0 && <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-lg border border-border bg-surface2">{matches.map(result => <button type="button" key={result.displayName} onClick={() => applySearchResult(result)} className="block w-full border-b border-border px-3 py-3 text-left text-xs text-zinc-300 last:border-0 hover:bg-surface hover:text-white">{result.displayName}</button>)}</div>}</form>{loading && <p className="mt-2 text-xs text-zinc-500">Searching geocoder...</p>}{error && <p className="mt-3 text-xs text-red-400">{error}</p>}<div className="mt-8 border-t border-border pt-5"><p className="text-xs text-zinc-500">Camera position</p><p className="mt-2 text-sm text-zinc-200">{locationLabel}</p><p className="mt-1 text-xs text-zinc-600">The rectangle is centered on the geocoder coordinate, not locked to an administrative boundary.</p></div><div className="mt-6 flex gap-2"><Button className="flex-1" disabled={!valid} onClick={() => draw.current?.changeMode('simple_select', { featureIds: ['active-aoi'] })}><MapPin size={16} />Edit rectangle</Button><Button variant="secondary" className="px-3" disabled={!valid} onClick={() => { draw.current?.deleteAll(); clearAoi(); }} aria-label="Clear region"><Trash2 size={15} /></Button></div><div className="mt-6 border-t border-border pt-5"><p className="text-xs text-zinc-500">Exact Turf.js bbox</p>{valid ? <p className="mt-2 break-all font-mono text-xs leading-6 text-zinc-200">[{aoiBbox.map(value => value.toFixed(6)).join(', ')}]</p> : <p className="mt-2 text-xs text-zinc-600">Search a location to create an editable rectangle.</p>}</div><Button className="mt-8 w-full" disabled={!valid} onClick={() => navigateTo('DATE_SCENES')}>Next: Select Dates <ArrowRight size={15} /></Button></aside><div ref={mapContainer} className="min-h-[560px] bg-black" /></div>{valid && <div className="mt-4"><Notice type="success">The editable rectangle is synchronized with investigation state as `[minLon, minLat, maxLon, maxLat]`.</Notice></div>}</PageFrame>;
}
