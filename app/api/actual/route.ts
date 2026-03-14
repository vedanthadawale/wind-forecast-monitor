import { NextRequest, NextResponse } from 'next/server';

const ELEXON_BASE = 'https://data.elexon.co.uk/bmrs/api/v1';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!from || !to) {
    return NextResponse.json({ error: 'from and to params required' }, { status: 400 });
  }

  try {
    // Elexon FUELHH stream - wind actual generation
    const url = new URL(`${ELEXON_BASE}/datasets/FUELHH/stream`);
    url.searchParams.set('publishDateTimeFrom', from);
    url.searchParams.set('publishDateTimeTo', to);

    const res = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      // Fallback: try alternate param names
      const url2 = new URL(`${ELEXON_BASE}/datasets/FUELHH/stream`);
      url2.searchParams.set('from', from);
      url2.searchParams.set('to', to);
      const res2 = await fetch(url2.toString(), { headers: { 'Accept': 'application/json' } });
      if (!res2.ok) {
        throw new Error(`Elexon API error: ${res2.status}`);
      }
      const data2 = await res2.json();
      const wind2 = filterWind(data2);
      return NextResponse.json(wind2);
    }

    const data = await res.json();
    const wind = filterWind(data);
    return NextResponse.json(wind);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Filter to only WIND fuel type and extract relevant fields
function filterWind(data: unknown): { startTime: string; generation: number }[] {
  const records: unknown[] = Array.isArray(data)
    ? data
    : (data as { data?: unknown[] })?.data ?? [];

  return records
    .filter((r: unknown) => {
      const record = r as Record<string, unknown>;
      return (
        typeof record.fuelType === 'string' &&
        record.fuelType.toUpperCase() === 'WIND'
      );
    })
    .map((r: unknown) => {
      const record = r as Record<string, unknown>;
      return {
        startTime: String(record.startTime),
        generation: Number(record.generation ?? record.quantity ?? 0),
      };
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}
