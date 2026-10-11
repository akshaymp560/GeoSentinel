import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button, Notice, PageFrame, StatusBadge } from '../common/ui';

export default function Screen6Evidence({ workflow, navigateTo }) {
  const dossier = workflow.investigationData?.evidence_dossier; const source = dossier?.agent_evidence_dossier || {}; const spectral = source.spectral_agent || {};
  const cards = [
    ['Water', spectral.water_agent, 'delta_ndwi_mean'], ['Vegetation', spectral.vegetation_agent, 'delta_ndvi_mean'], ['Land disturbance', spectral.land_disturbance_agent, 'mean_delta_brightness'],
    ['Weather', source.weather_agent, 'total_precipitation_mm'], ['Elevation', source.elevation_agent, 'relief_delta_m'], ['Fire detections', source.fire_agent, 'active_hotspots'],
    ['Land cover', source.landcover_agent, 'tree_cover_pct'], ['News', source.news_agent, 'article_count'],
  ];
  return <PageFrame eyebrow="Investigation / evidence" title="Multi-source evidence review" description="Flat evidence cards expose only values returned by the environmental agents. A missing agent remains unavailable rather than being represented as zero." actions={<Button variant="secondary" onClick={() => navigateTo('REPORT')}>View report <ArrowRight size={15} /></Button>}>{!dossier ? <Notice>No evidence dossier was returned by the backend for this analysis.</Notice> : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{cards.map(([label, agent, metric]) => { const value = agent?.metrics?.[metric] ?? agent?.[metric]; const status = agent?.status || (agent ? 'ANALYZED' : 'UNAVAILABLE'); return <article key={label} className="rounded-xl border border-border bg-surface p-5"><div className="flex items-start justify-between gap-3"><h2 className="text-sm font-semibold text-white">{label}</h2><StatusBadge status={status} /></div><div className="mt-7 font-mono text-2xl text-white">{value == null ? '—' : String(value)}</div><p className="mt-2 text-xs leading-5 text-textmuted">{agent?.finding || agent?.signal || 'No metric or interpretation was returned for this agent.'}</p><details className="mt-5 border-t border-border pt-3"><summary className="cursor-pointer text-xs text-zinc-500 hover:text-white">Source details</summary><pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap text-[11px] leading-5 text-zinc-500">{agent ? JSON.stringify(agent, null, 2) : 'Unavailable'}</pre></details></article>; })}</div>}</PageFrame>;
}
