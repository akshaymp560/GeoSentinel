import axios from 'axios';

export async function searchLocation(query) {
  if (!query || query.trim().length < 2) return [];
  const response = await axios.get('https://nominatim.openstreetmap.org/search', {
    params: { q: query.trim(), format: 'json', limit: 5, addressdetails: 1 },
    headers: { 'Accept-Language': 'en' },
    timeout: 10000,
  });
  return response.data.map(item => {
    const [south, north, west, east] = item.boundingbox.map(Number);
    return { displayName: item.display_name, name: item.name || item.display_name.split(',')[0], lat: Number(item.lat), lon: Number(item.lon), bbox: [west, south, east, north] };
  });
}
