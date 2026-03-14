import { NextRequest, NextResponse } from 'next/server';

const ELEXON_BASE = 'https://data.elexon.co.uk/bmrs/api/v1';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');   // target startTime from
  const to = searchParams.get('to');       // target startTime to

  if (!from || !to) {
    return NextResponse.json({ error: 'from and to params required' }, { status: 400 });
  }

  try {
    // Fetch WINDFOR stream - wind power forecasts
    // We fetch a wider window to ensure we have all relevant publishTimes
    const fromDt = new Date(from);
    // Extend back by 48 hours to capture forecasts made up to 48h before
    const extendedFrom = new Date(fromDt.getTime() - 48 * 60 * 60 * 1000).toISOString();

    const url = new URL(`${ELEXON_BASE}/datasets/WINDFOR/stream`);
    url.searchParams.set('publishDateTimeFrom', extendedFrom);
    url.searchParams.set('publishDateTimeTo', to);

    const res = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      // Fallback with different param names
      const url2 = new URL(`${ELEXON_BASE}/datasets/WINDFOR/stream`);
      url2.searchParams.set('from', extendedFrom);
      url2.searchParams.set('to', to);
      const res2 = await fetch(url2.toString(), { headers: { 'Accept': 'application/json' } });
      if (!res2.ok) {
        throw new Error(`Elexon API error: ${res2.status}`);
      }
      const data2 = await res2.json();
      return NextResponse.json(normalise(data2));
    }

    const data = await res.json();
    return NextResponse.json(normalise(data));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

interface ForecastPoint {
  startTime: string;
  publishTime: string;
  generation: number;
}

function normalise(data: unknown): ForecastPoint[] {
  const records: unknown[] = Array.isArray(data)
    ? data
    : (data as { data?: unknown[] })?.data ?? [];

  return records
    .map((r: unknown) => {
      const record = r as Record<string, unknown>;
      return {
        startTime: String(record.startTime),
        publishTime: String(record.publishTime ?? record.publishDateTime ?? record.createdDateTime ?? ''),
        generation: Number(record.generation ?? record.quantity ?? 0),
      };
    })
    .filter((r) => r.publishTime && r.publishTime !== 'undefined')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}
