'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { ChartPoint, fmtMW, formatTooltipTime } from '@/lib/dataUtils';
import { useMemo } from 'react';

interface Props {
  data: ChartPoint[];
  loading?: boolean;
}

const TICK_INTERVAL = 4; // show every 4th tick (every 2 hours at 30-min resolution)

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const actual = payload.find((p) => p.name === 'Actual');
  const forecast = payload.find((p) => p.name === 'Forecast');
  const diff =
    actual?.value != null && forecast?.value != null
      ? forecast.value - actual.value
      : null;

  return (
    <div
      style={{
        background: 'rgba(17, 22, 17, 0.97)',
        border: '1px solid #243020',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '12px',
        fontFamily: 'DM Sans, sans-serif',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        minWidth: '180px',
      }}
    >
      <div style={{ color: '#8dab82', marginBottom: 8, fontWeight: 500 }}>
        {label ? formatTooltipTime(label) : ''}
      </div>
      {actual && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
          <span style={{ color: '#60a5fa' }}>● Actual</span>
          <span style={{ color: '#e8f5e2', fontFamily: 'JetBrains Mono, monospace' }}>
            {actual.value.toLocaleString()} MW
          </span>
        </div>
      )}
      {forecast && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
          <span style={{ color: '#4ade80' }}>● Forecast</span>
          <span style={{ color: '#e8f5e2', fontFamily: 'JetBrains Mono, monospace' }}>
            {forecast.value.toLocaleString()} MW
          </span>
        </div>
      )}
      {diff != null && (
        <div
          style={{
            borderTop: '1px solid #243020',
            marginTop: 8,
            paddingTop: 8,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <span style={{ color: '#4d6647' }}>Error</span>
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              color: Math.abs(diff) > 500 ? '#fbbf24' : '#8dab82',
            }}
          >
            {diff > 0 ? '+' : ''}{diff.toLocaleString()} MW
          </span>
        </div>
      )}
    </div>
  );
}

function CustomLegend() {
  return (
    <div style={{ display: 'flex', gap: 24, justifyContent: 'center', paddingTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="24" height="3">
          <line x1="0" y1="1.5" x2="24" y2="1.5" stroke="#60a5fa" strokeWidth="2.5" />
        </svg>
        <span style={{ color: '#8dab82', fontSize: 13 }}>Actual Generation</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="24" height="3">
          <line x1="0" y1="1.5" x2="24" y2="1.5" stroke="#4ade80" strokeWidth="2.5" strokeDasharray="6 3" />
        </svg>
        <span style={{ color: '#8dab82', fontSize: 13 }}>Forecast</span>
      </div>
    </div>
  );
}

export default function ForecastChart({ data, loading }: Props) {
  const visibleTicks = useMemo(() => {
    return data
      .map((d, i) => (i % TICK_INTERVAL === 0 ? d.time : null))
      .filter(Boolean) as string[];
  }, [data]);

  const yValues = data.flatMap((d) => [d.actual, d.forecast].filter((v) => v != null) as number[]);
  const yMin = yValues.length ? Math.floor(Math.min(...yValues) / 1000) * 1000 : 0;
  const yMax = yValues.length ? Math.ceil(Math.max(...yValues) / 1000) * 1000 : 30000;

  if (loading) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div className="skeleton" style={{ width: '100%', height: '70%', opacity: 0.6 }} />
        <div style={{ color: '#4d6647', fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }}>
          Fetching data...
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 8,
          color: '#4d6647',
        }}
      >
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 3v18h18" strokeLinecap="round" />
          <path d="M7 16l4-4 4 4 4-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p style={{ fontSize: 14 }}>No data to display. Select a date range and load.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
        <defs>
          <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.1} />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(77,102,71,0.2)"
          vertical={false}
        />
        <XAxis
          dataKey="time"
          ticks={visibleTicks}
          tickFormatter={(v: string) => {
            try {
              const d = new Date(v);
              return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
            } catch { return v; }
          }}
          tick={{ fill: '#4d6647', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
          axisLine={{ stroke: '#243020' }}
          tickLine={false}
          label={{
            value: 'Target Time (UTC)',
            position: 'insideBottom',
            offset: -10,
            fill: '#4d6647',
            fontSize: 12,
          }}
        />
        <YAxis
          domain={[yMin, yMax]}
          tickFormatter={(v: number) => `${fmtMW(v)}`}
          tick={{ fill: '#4d6647', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
          axisLine={{ stroke: '#243020' }}
          tickLine={false}
          label={{
            value: 'Power (MW)',
            angle: -90,
            position: 'insideLeft',
            offset: 10,
            fill: '#4d6647',
            fontSize: 12,
          }}
          width={55}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#243020', strokeWidth: 1 }} />
        <Legend content={<CustomLegend />} />
        <Line
          type="monotone"
          dataKey="actual"
          name="Actual"
          stroke="#60a5fa"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4, fill: '#60a5fa', strokeWidth: 0 }}
          connectNulls={false}
        />
        <Line
          type="monotone"
          dataKey="forecast"
          name="Forecast"
          stroke="#4ade80"
          strokeWidth={2.5}
          strokeDasharray="6 3"
          dot={false}
          activeDot={{ r: 4, fill: '#4ade80', strokeWidth: 0 }}
          connectNulls={true}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
