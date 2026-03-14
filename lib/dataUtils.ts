export interface ActualPoint {
  startTime: string;
  generation: number;
}

export interface ForecastPoint {
  startTime: string;
  publishTime: string;
  generation: number;
}

export interface ChartPoint {
  time: string;       // ISO string of target time
  label: string;      // Formatted label for x-axis
  actual?: number;
  forecast?: number;
}

/**
 * For each actual data point (target time), find the latest forecast
 * where publishTime <= targetTime - horizonHours.
 * Returns merged array ready for Recharts.
 */
export function mergeActualAndForecast(
  actuals: ActualPoint[],
  forecasts: ForecastPoint[],
  horizonHours: number
): ChartPoint[] {
  // Group forecasts by startTime (normalised to minute)
  const forecastsByTarget = new Map<string, ForecastPoint[]>();
  for (const f of forecasts) {
    const key = normaliseTime(f.startTime);
    const existing = forecastsByTarget.get(key) ?? [];
    existing.push(f);
    forecastsByTarget.set(key, existing);
  }

  const horizonMs = horizonHours * 60 * 60 * 1000;

  return actuals.map((a): ChartPoint => {
    const targetMs = new Date(a.startTime).getTime();
    const cutoffMs = targetMs - horizonMs;
    const key = normaliseTime(a.startTime);

    const candidates = forecastsByTarget.get(key) ?? [];
    // Filter: publishTime <= cutoff, i.e. published at least horizonHours before target
    const eligible = candidates.filter(
      (f) => new Date(f.publishTime).getTime() <= cutoffMs
    );

    // Take the latest publish time among eligible
    let forecastVal: number | undefined;
    if (eligible.length > 0) {
      const latest = eligible.reduce((prev, curr) =>
        new Date(curr.publishTime).getTime() > new Date(prev.publishTime).getTime()
          ? curr
          : prev
      );
      forecastVal = latest.generation;
    }

    return {
      time: a.startTime,
      label: formatAxisLabel(a.startTime),
      actual: a.generation,
      forecast: forecastVal,
    };
  });
}

/** Normalise a datetime string to remove seconds/ms for grouping */
function normaliseTime(iso: string): string {
  try {
    const d = new Date(iso);
    // Round to nearest 30-minute slot
    const mins = d.getUTCMinutes() < 30 ? 0 : 30;
    d.setUTCMinutes(mins, 0, 0);
    return d.toISOString().slice(0, 16);
  } catch {
    return iso.slice(0, 16);
  }
}

export function formatAxisLabel(iso: string): string {
  try {
    const d = new Date(iso);
    const day = d.getUTCDate().toString().padStart(2, '0');
    const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const hours = d.getUTCHours().toString().padStart(2, '0');
    const mins = d.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${mins}\n${day}/${month}`;
  } catch {
    return iso;
  }
}

export function formatTooltipTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toUTCString().replace(' GMT', ' UTC').slice(5, 22);
  } catch {
    return iso;
  }
}

/** Compute basic stats for the stats cards */
export function computeStats(data: ChartPoint[]) {
  const paired = data.filter((d) => d.actual != null && d.forecast != null);
  if (paired.length === 0) return null;

  const errors = paired.map((d) => d.forecast! - d.actual!);
  const absErrors = errors.map(Math.abs);
  const mae = absErrors.reduce((s, v) => s + v, 0) / absErrors.length;
  const mbe = errors.reduce((s, v) => s + v, 0) / errors.length;
  const rmse = Math.sqrt(
    errors.map((e) => e * e).reduce((s, v) => s + v, 0) / errors.length
  );

  const actuals = paired.map((d) => d.actual!);
  const avgActual = actuals.reduce((s, v) => s + v, 0) / actuals.length;
  const nmae = (mae / avgActual) * 100;

  return { mae: Math.round(mae), mbe: Math.round(mbe), rmse: Math.round(rmse), nmae: nmae.toFixed(1) };
}

/** Format datetime-local input value to ISO string */
export function localInputToISO(localStr: string): string {
  // datetime-local returns "YYYY-MM-DDTHH:mm", treat as UTC
  return `${localStr}:00.000Z`;
}

/** Format ISO to datetime-local input value */
export function isoToLocalInput(iso: string): string {
  return iso.slice(0, 16);
}

/** Format power value for display */
export function fmtMW(val: number): string {
  if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
  return val.toFixed(0);
}
