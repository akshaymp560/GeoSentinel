import axios from 'axios';

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const client = axios.create({ baseURL: API_BASE, timeout: 120000 });

export function resolveArtifactUrl(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return API_BASE + '/' + String(url).replace(/^\//, '');
}

export function normalizeApiError(error) {
  if (error?.code === 'ECONNABORTED') return 'The analysis request timed out. The backend may still be processing; verify the job state before retrying.';
  if (!error?.response) return 'The GeoSentinel backend is unavailable. Check that FastAPI is running and try again.';
  const detail = error.response.data?.detail;
  return typeof detail === 'string' ? detail : 'Backend request failed with HTTP ' + error.response.status + '.';
}

export async function checkBackendHealth() {
  const response = await client.get('/api/health', { timeout: 8000 });
  return response.data;
}

export async function executeChangeDetection({ bbox, dates, threshold = 0.5, includeAgentSwarm = true, generateDossier = true }) {
  const response = await client.post('/api/detect-change', {
    bbox,
    pre_start: dates.preStart,
    pre_end: dates.preEnd,
    post_start: dates.postStart,
    post_end: dates.postEnd,
    threshold,
    include_agent_swarm: includeAgentSwarm,
    generate_dossier: generateDossier,
  });
  return response.data;
}
