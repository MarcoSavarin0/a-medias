'use client';

import { useEffect, useState } from 'react';

type Rate = { date: string; rate: number };

export default function Converter() {
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState<Rate | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    fetch('https://api.frankfurter.dev/v2/rate/ARS/BRL', { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('Cotización no disponible');
        return response.json();
      })
      .then(data => {
        if (data.base !== 'ARS' || data.quote !== 'BRL' || !Number.isFinite(data.rate) || data.rate <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) throw new Error('Cotización inválida');
        setRate({ date: data.date, rate: data.rate });
      })
      .catch(() => { if (!controller.signal.aborted || !cancelled) setError(true); })
      .finally(() => clearTimeout(timeout));
    let cancelled = false;
    return () => { cancelled = true; clearTimeout(timeout); controller.abort(); };
  }, []);

  const parsed = Number(amount.replace(',', '.'));
  const valid = /^\d+(?:[.,]\d{1,2})?$/.test(amount) && Number.isFinite(parsed);
  return <section className="side-card converter" aria-labelledby="converter-title">
    <h2 id="converter-title">Pesos a reales</h2>
    <p className="side-intro">Consultá una conversión estimada de pesos argentinos a reales brasileños.</p>
    <label>Pesos argentinos (ARS)<input type="text" inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} placeholder="Ej. 10000" /></label>
    {amount && !valid && <p className="error" role="alert">Ingresá un importe válido con hasta dos decimales.</p>}
    <p aria-live="polite">{error ? 'No pudimos obtener la cotización. Intentá de nuevo más tarde.' : !rate ? 'Cargando cotización…' : valid ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'BRL' }).format(parsed * rate.rate) : 'Ingresá un importe para convertir.'}</p>
    {rate && <small>Cotización de referencia del {rate.date} · Fuente: Frankfurter</small>}
  </section>;
}
