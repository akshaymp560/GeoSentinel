import React from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export function Button({ variant = 'primary', loading = false, className = '', children, ...props }) {
  const styles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500',
    secondary: 'border border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800 disabled:text-zinc-600',
    tertiary: 'text-zinc-400 hover:text-white disabled:text-zinc-700',
    destructive: 'bg-red-700 text-white hover:bg-red-800 disabled:bg-zinc-800 disabled:text-zinc-500',
  };
  return <button className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed ${styles[variant]} ${className}`} disabled={loading || props.disabled} {...props}>{loading && <Loader2 size={16} className="animate-spin" />}{children}</button>;
}

export function StatusBadge({ status = 'UNAVAILABLE' }) {
  const value = String(status).toUpperCase();
  const styles = value.includes('COMPLETED') || value === 'AVAILABLE' || value === 'ONLINE' ? 'border-green-900 bg-green-950/40 text-green-400' : value.includes('FAILED') || value.includes('ERROR') ? 'border-red-900 bg-red-950/40 text-red-400' : value.includes('DEGRADED') || value.includes('LIMIT') || value === 'RUNNING' ? 'border-amber-900 bg-amber-950/40 text-amber-400' : 'border-zinc-700 bg-zinc-900 text-zinc-400';
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-medium ${styles}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{value.replaceAll('_', ' ')}</span>;
}

export function PageFrame({ eyebrow, title, description, actions, children }) {
  return <main className="flex-1 overflow-auto bg-black"><div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10"><div className="mb-8 flex flex-col justify-between gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-medium text-zinc-500">{eyebrow}</p><h1 className="text-3xl font-medium tracking-tight text-white">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{description}</p>}</div>{actions && <div className="flex flex-wrap gap-2">{actions}</div>}</div>{children}</div></main>;
}

export function Notice({ type = 'error', children }) {
  const Icon = type === 'success' ? CheckCircle2 : AlertCircle;
  const color = type === 'success' ? 'border-green-900/70 bg-green-950/20 text-green-300' : 'border-red-900/70 bg-red-950/20 text-red-300';
  return <div role={type === 'error' ? 'alert' : 'status'} className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${color}`}><Icon size={17} className="mt-0.5 shrink-0" />{children}</div>;
}

export function Metric({ label, value, mono = false }) { return <div><dt className="text-xs text-zinc-500">{label}</dt><dd className={`mt-1 text-sm text-zinc-100 ${mono ? 'font-mono' : ''}`}>{value ?? 'Unavailable'}</dd></div>; }

