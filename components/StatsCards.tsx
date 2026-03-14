'use client';

interface Stats {
  mae: number;
  mbe: number;
  rmse: number;
  nmae: string;
}

interface Props {
  stats: Stats | null;
  loading?: boolean;
}

function StatCard({
  label,
  value,
  unit,
  description,
  positive,
  loading,
}: {
  label: string;
  value: string | number;
  unit?: string;
  description: string;
  positive?: boolean | null;
  loading?: boolean;
}) {
  const valueColor =
    positive === null ? '#8dab82' : positive ? '#4ade80' : '#fbbf24';

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--bg-border)',
        borderRadius: '10px',
        padding: '14px 18px',
        flex: '1 1 0',
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: 'var(--text-muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 6,
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      {loading ? (
        <div className="skeleton" style={{ height: 28, width: '60%', marginBottom: 6 }} />
      ) : (
        <div
          style={{
            fontSize: 22,
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 500,
            color: valueColor,
            lineHeight: 1.1,
            marginBottom: 4,
          }}
        >
          {value}
          {unit && (
            <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 4 }}>
              {unit}
            </span>
          )}
        </div>
      )}
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{description}</div>
    </div>
  );
}

export default function StatsCards({ stats, loading }: Props) {
  const mbePositive = stats ? (Math.abs(stats.mbe) < 300 ? null : stats.mbe < 0 ? true : false) : null;

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      <StatCard
        label="MAE"
        value={loading ? '—' : stats ? stats.mae.toLocaleString() : '—'}
        unit="MW"
        description="Mean Absolute Error"
        positive={null}
        loading={loading}
      />
      <StatCard
        label="NMAE"
        value={loading ? '—' : stats ? `${stats.nmae}%` : '—'}
        description="Normalised MAE"
        positive={stats ? parseFloat(stats.nmae) < 5 : null}
        loading={loading}
      />
      <StatCard
        label="RMSE"
        value={loading ? '—' : stats ? stats.rmse.toLocaleString() : '—'}
        unit="MW"
        description="Root Mean Squared Error"
        positive={null}
        loading={loading}
      />
      <StatCard
        label="MBE"
        value={
          loading
            ? '—'
            : stats
            ? `${stats.mbe > 0 ? '+' : ''}${stats.mbe.toLocaleString()}`
            : '—'
        }
        unit="MW"
        description="Mean Bias Error (over/under)"
        positive={mbePositive}
        loading={loading}
      />
    </div>
  );
}
