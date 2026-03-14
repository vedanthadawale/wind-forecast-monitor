'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import StatsCards from '@/components/StatsCards';
import {
  mergeActualAndForecast,
  computeStats,
  localInputToISO,
  isoToLocalInput,
  type ChartPoint,
  type ActualPoint,
  type ForecastPoint,
} from '@/lib/dataUtils';

// Lazy load chart to avoid SSR issues with recharts
const ForecastChart = dynamic(() => import('@/components/ForecastChart'), {
  ssr: false,
  loading: () => <div className="skeleton" style={{ width: '100%', height: '100%' }} />,
});

const DEFAULT_START = '2024-01-15T00:00';
const DEFAULT_END = '2024-01-16T00:00';
const HORIZON_MIN = 0;
const HORIZON_MAX = 48;
const HORIZON_DEFAULT = 4;

type LoadState = 'idle' | 'loading' | 'done' | 'error';

export default function HomePage() {
  const [startTime, setStartTime] = useState(DEFAULT_START);
  const [endTime, setEndTime] = useState(DEFAULT_END);
  const [horizon, setHorizon] = useState(HORIZON_DEFAULT);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [fetchedActuals, setFetchedActuals] = useState<ActualPoint[]>([]);
  const [fetchedForecasts, setFetchedForecasts] = useState<ForecastPoint[]>([]);

  const stats = computeStats(chartData);

  // Re-merge when horizon changes (without re-fetching)
  useEffect(() => {
    if (fetchedActuals.length === 0) return;
    const merged = mergeActualAndForecast(fetchedActuals, fetchedForecasts, horizon);
    setChartData(merged);
  }, [horizon, fetchedActuals, fetchedForecasts]);

  const handleLoad = useCallback(async () => {
    if (!startTime || !endTime) return;
    const start = localInputToISO(startTime);
    const end = localInputToISO(endTime);

    if (new Date(start) >= new Date(end)) {
      setErrorMsg('Start time must be before end time.');
      return;
    }

    // Limit to max 7 days to avoid huge requests
    const diffDays = (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 7) {
      setErrorMsg('Please select a range of 7 days or less for performance.');
      return;
    }

    setLoadState('loading');
    setErrorMsg('');
    setChartData([]);

    try {
      const [actualRes, forecastRes] = await Promise.all([
        fetch(`/api/actual?from=${encodeURIComponent(start)}&to=${encodeURIComponent(end)}`),
        fetch(`/api/forecast?from=${encodeURIComponent(start)}&to=${encodeURIComponent(end)}`),
      ]);

      if (!actualRes.ok) throw new Error(`Actuals API error: ${actualRes.status}`);
      if (!forecastRes.ok) throw new Error(`Forecast API error: ${forecastRes.status}`);

      const actuals: ActualPoint[] = await actualRes.json();
      const forecasts: ForecastPoint[] = await forecastRes.json();

      if (!Array.isArray(actuals)) throw new Error('Unexpected actuals response format');
      if (!Array.isArray(forecasts)) throw new Error('Unexpected forecasts response format');

      setFetchedActuals(actuals);
      setFetchedForecasts(forecasts);

      const merged = mergeActualAndForecast(actuals, forecasts, horizon);
      setChartData(merged);
      setLoadState('done');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setErrorMsg(msg);
      setLoadState('error');
    }
  }, [startTime, endTime, horizon]);

  const isLoading = loadState === 'loading';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: '1px solid var(--bg-border)',
          background: 'var(--bg-surface)',
          padding: '0 20px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="13" stroke="#4ade80" strokeWidth="1.5" strokeDasharray="4 2" />
            <path d="M14 7 L14 21 M8 11 L14 7 L20 11" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="14" cy="14" r="2" fill="#4ade80" />
            <path d="M7 16 Q14 20 21 16" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </svg>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              UK Wind Forecast Monitor
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              National Grid · BMRS Data
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            className={isLoading ? 'pulse-dot' : ''}
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: isLoading ? '#fbbf24' : loadState === 'done' ? '#4ade80' : '#4d6647',
            }}
          />
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
            {isLoading ? 'Loading...' : loadState === 'done' ? `${chartData.length} pts` : 'Ready'}
          </span>
        </div>
      </header>

      {/* Controls Bar */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--bg-border)',
          padding: '14px 20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            alignItems: 'flex-end',
            maxWidth: 1200,
            margin: '0 auto',
          }}
        >
          {/* Start Time */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: '1 1 180px', minWidth: 180 }}>
            <label style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
              Start Time (UTC)
            </label>
            <input
              type="datetime-local"
              value={isoToLocalInput(startTime)}
              min="2024-01-01T00:00"
              max="2024-01-31T23:30"
              onChange={(e) => setStartTime(e.target.value)}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--bg-border)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                padding: '8px 12px',
                fontSize: 13,
                fontFamily: 'JetBrains Mono, monospace',
                outline: 'none',
                width: '100%',
              }}
            />
          </div>

          {/* End Time */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: '1 1 180px', minWidth: 180 }}>
            <label style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
              End Time (UTC)
            </label>
            <input
              type="datetime-local"
              value={isoToLocalInput(endTime)}
              min="2024-01-01T00:00"
              max="2024-01-31T23:30"
              onChange={(e) => setEndTime(e.target.value)}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--bg-border)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                padding: '8px 12px',
                fontSize: 13,
                fontFamily: 'JetBrains Mono, monospace',
                outline: 'none',
                width: '100%',
              }}
            />
          </div>

          {/* Horizon Slider */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: '1 1 200px', minWidth: 180 }}>
            <label style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
              Forecast Horizon
              <span style={{ color: 'var(--accent-green)', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, marginLeft: 8, textTransform: 'none', letterSpacing: 0 }}>
                {horizon}h
              </span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 36 }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', minWidth: 16 }}>0</span>
              <input
                type="range"
                min={HORIZON_MIN}
                max={HORIZON_MAX}
                step={1}
                value={horizon}
                onChange={(e) => setHorizon(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', minWidth: 20 }}>48</span>
            </div>
          </div>

          {/* Load Button */}
          <button
            onClick={handleLoad}
            disabled={isLoading}
            style={{
              background: isLoading ? 'var(--bg-elevated)' : 'var(--accent-green)',
              color: isLoading ? 'var(--text-muted)' : '#0a0f0a',
              border: 'none',
              borderRadius: 8,
              padding: '9px 24px',
              fontSize: 13,
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              height: 36,
              minWidth: 100,
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              alignSelf: 'flex-end',
            }}
          >
            {isLoading ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
                </svg>
                Loading
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Load Data
              </>
            )}
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div
            style={{
              marginTop: 10,
              padding: '8px 12px',
              background: 'rgba(251, 191, 36, 0.08)',
              border: '1px solid rgba(251, 191, 36, 0.25)',
              borderRadius: 6,
              color: '#fbbf24',
              fontSize: 12,
              maxWidth: 1200,
              margin: '10px auto 0',
            }}
          >
            ⚠ {errorMsg}
          </div>
        )}
      </div>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '16px 20px 24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        {/* Stats Row */}
        <div style={{ marginBottom: 14 }}>
          <StatsCards stats={stats} loading={isLoading} />
        </div>

        {/* Chart */}
        <div
          className={loadState === 'done' ? 'fade-in' : ''}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)',
            borderRadius: 12,
            padding: '20px 10px 16px 4px',
            height: 'clamp(320px, 50vh, 520px)',
            position: 'relative',
          }}
        >
          <ForecastChart data={chartData} loading={isLoading} />
        </div>

        {/* Footer info */}
        {loadState === 'done' && chartData.length > 0 && (
          <div
            style={{
              marginTop: 10,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              fontSize: 11,
              color: 'var(--text-muted)',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            <span>
              ● {chartData.filter((d) => d.actual != null).length} actual points
            </span>
            <span>
              ● {chartData.filter((d) => d.forecast != null).length} forecast points matched (horizon: {horizon}h)
            </span>
            <span>● Data: January 2024 · Source: Elexon BMRS</span>
          </div>
        )}

        {/* Info card when idle */}
        {loadState === 'idle' && (
          <div
            style={{
              marginTop: 16,
              padding: '16px 20px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              borderRadius: 10,
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
            }}
          >
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
              How to use
            </strong>
            Select a date range within <strong style={{ color: 'var(--accent-green)' }}>January 2024</strong> and adjust the forecast horizon slider, then click <strong style={{ color: 'var(--accent-green)' }}>Load Data</strong>. The chart will display actual UK wind generation (blue) against the latest forecast published at least <em>horizon</em> hours before each target time (green). Error metrics are shown above the chart.
          </div>
        )}
      </main>
    </div>
  );
}
