import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://api.comparapix.ar/quotes', { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Cotizaciones no disponibles');
    const data = await response.json();
    const provider = data['mercado-pago'];
    const quote = provider?.quotes?.find((item: { symbol: string }) => item.symbol === 'BRLARS');
    const updatedAt = Date.parse(provider?.updatedAt);
    if (provider?.stale !== false || !Number.isFinite(quote?.buy) || quote.buy <= 0 || !Number.isFinite(updatedAt) || Date.now() - updatedAt > 30 * 60 * 1000 || updatedAt > Date.now() + 60000) throw new Error('Cotización desactualizada');
    return NextResponse.json({ rate: quote.buy, updatedAt: provider.updatedAt });
  } catch {
    return NextResponse.json({ error: 'Cotización no disponible' }, { status: 503 });
  }
}
