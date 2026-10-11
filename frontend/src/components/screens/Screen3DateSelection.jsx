import React from 'react';
import { ArrowLeft, ArrowRight, CalendarDays } from 'lucide-react';
import { Button, PageFrame } from '../common/ui';

function shiftDate(value, days) {
  if (!value) return '';
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) return '';
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function DateInput({ label, value, onChange }) {
  return <label className="block text-sm text-zinc-300">{label}<input type="date" value={value} onChange={event => onChange(event.target.value)} className="mt-2 block w-full rounded-lg border border-border bg-surface2 px-3 py-2.5 text-sm text-white outline-none focus:border-primary" /></label>;
}

export default function Screen3DateSelection({ workflow, setWorkflow, navigateTo, startAnalysis, analysisStatus }) {
  const dates = workflow.dates;
  const beforeDate = dates.beforeDate || dates.preEnd || '';
  const afterDate = dates.afterDate || dates.postStart || '';
  const valid = Boolean(beforeDate && afterDate && beforeDate < afterDate);

  const updateBefore = value => setWorkflow(current => ({
    ...current,
    dates: {
      ...current.dates,
      beforeDate: value,
      preStart: shiftDate(value, -30),
      preEnd: value,
    },
  }));

  const updateAfter = value => setWorkflow(current => ({
    ...current,
    dates: {
      ...current.dates,
      afterDate: value,
      postStart: value,
      postEnd: shiftDate(value, 30),
    },
  }));

  const actual = workflow.investigationData?.metadata;
  return <PageFrame eyebrow="Investigation setup / 02" title="Choose observation dates" description="Choose the two observations you want to compare. GeoSentinel-AI derives a 30-day compositing window around each date for the FastAPI request."><div className="grid gap-5 lg:grid-cols-[1fr_1fr]"><section className="border border-border bg-surface p-5"><CalendarDays size={20} className="text-zinc-300" /><h2 className="mt-4 text-lg font-medium text-white">Observation dates</h2><div className="mt-6 grid gap-5 sm:grid-cols-2"><DateInput label="Before Date (Pre-event)" value={beforeDate} onChange={updateBefore} /><DateInput label="After Date (Post-event)" value={afterDate} onChange={updateAfter} /></div>{!valid && <p className="mt-4 text-xs text-amber-400">Choose two dates with the before observation earlier than the after observation.</p>}<div className="mt-6 border-t border-border pt-5"><p className="text-xs text-zinc-500">Backend compositing windows</p><dl className="mt-3 grid gap-3 font-mono text-xs text-zinc-300 sm:grid-cols-2"><div><dt className="text-zinc-600">pre_start</dt><dd className="mt-1">{dates.preStart || '—'}</dd></div><div><dt className="text-zinc-600">pre_end</dt><dd className="mt-1">{dates.preEnd || '—'}</dd></div><div><dt className="text-zinc-600">post_start</dt><dd className="mt-1">{dates.postStart || '—'}</dd></div><div><dt className="text-zinc-600">post_end</dt><dd className="mt-1">{dates.postEnd || '—'}</dd></div></dl></div><div className="mt-8 flex justify-between gap-2"><Button variant="tertiary" onClick={() => navigateTo('LOCATION_AOI')}><ArrowLeft size={15} />Back</Button><Button disabled={!valid || analysisStatus === 'running'} loading={analysisStatus === 'running'} onClick={startAnalysis}>{analysisStatus === 'running' ? 'Submitting analysis' : 'Start analysis'} <ArrowRight size={15} /></Button></div></section><section className="border border-border bg-surface p-5"><h2 className="text-lg font-medium text-white">Scene availability</h2><p className="mt-2 text-sm leading-6 text-zinc-500">No separate scene-discovery endpoint exists in the current FastAPI application. Do not treat requested dates as acquisitions.</p><div className="mt-6 grid gap-4 sm:grid-cols-2">{[['Before', actual?.pre_acquisition_date], ['After', actual?.post_acquisition_date]].map(([label, date]) => <div key={label} className="border border-border p-4"><div className="text-xs text-zinc-500">{label} acquisition</div><div className="mt-3 text-lg text-white">{date || 'Unavailable until analysis'}</div>{date && <div className="mt-2 text-xs text-zinc-500">Returned by the detection pipeline</div>}</div>)}</div></section></div></PageFrame>;
}
