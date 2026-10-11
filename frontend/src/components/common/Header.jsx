import React, { useEffect, useState } from 'react';
import { ChevronRight, CircleHelp, Globe2 } from 'lucide-react';
import { checkBackendHealth } from '../../services/api';
import { Button, StatusBadge } from './ui';

const setupSteps = [['LOCATION_AOI', 'Location & AOI'], ['DATE_SCENES', 'Dates'], ['PROCESSING', 'Analysis']];
const investigationScreens = { EXPLORER: 'Explorer', EVIDENCE: 'Evidence', REPORT: 'Report' };

export default function Header({ screen, investigationId, navigateTo }) {
  const [health, setHealth] = useState('OFFLINE');
  useEffect(() => { let active = true; checkBackendHealth().then(data => active && setHealth(data?.status || 'ONLINE')).catch(() => active && setHealth('OFFLINE')); return () => { active = false; }; }, []);
  const setup = setupSteps.some(([id]) => id === screen);
  const investigation = investigationScreens[screen];
  return <header className="z-30 flex min-h-16 shrink-0 items-center justify-between gap-4 border-b border-zinc-800 bg-black px-4 lg:px-7">
    <button onClick={() => navigateTo('LANDING')} className="flex items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400" aria-label="GeoSentinel-AI home"><Globe2 className="text-blue-500" size={21} /><span className="font-semibold tracking-tight text-white">GeoSentinel-AI</span></button>
    <nav className="flex min-w-0 flex-1 justify-center" aria-label="Workflow navigation">
      {setup && <ol className="flex items-center gap-1 text-xs sm:gap-2 sm:text-sm">{setupSteps.map(([id, label], index) => <React.Fragment key={id}><li><button onClick={() => navigateTo(id)} className={`rounded px-2 py-1.5 ${screen === id ? 'text-blue-400' : 'text-zinc-500 hover:text-zinc-200'}`}><span className="mr-1 font-mono">({index + 1})</span>{label}</button></li>{index < 2 && <ChevronRight size={14} className="text-zinc-700" />}</React.Fragment>)}</ol>}
      {investigation && <div className="truncate text-xs text-zinc-400 sm:text-sm"><span>Investigation</span><ChevronRight size={14} className="mx-2 inline text-zinc-700" /><span className="font-mono text-blue-400">{investigationId}</span><ChevronRight size={14} className="mx-2 inline text-zinc-700" /><span className="text-zinc-200">{investigation}</span></div>}
      {screen === 'LANDING' && <div className="hidden items-center gap-5 text-sm text-zinc-400 md:flex"><button className="hover:text-white" onClick={() => navigateTo('LANDING')}>Home</button><button className="flex items-center gap-1 hover:text-white"><CircleHelp size={14} />Help</button></div>}
    </nav>
    <div className="flex items-center gap-3"><div className="hidden sm:block"><StatusBadge status={health} /></div>{screen === 'LANDING' ? <Button className="min-h-9 px-3 text-xs" onClick={() => navigateTo('LOCATION_AOI')}>New investigation</Button> : <button onClick={() => navigateTo('LANDING')} className="text-xs text-zinc-500 hover:text-white">Exit</button>}</div>
  </header>;
}
