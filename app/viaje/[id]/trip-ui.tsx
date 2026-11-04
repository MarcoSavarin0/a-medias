'use client';
import { useEffect, useState } from 'react';
import { saveExpense, deleteExpense } from '@/app/actions';
type Member = { id: string; name: string };
type Expense = { id: string; description: string; amount: number; payerId: string; participantIds: string[] };
type Rate = { rate: number; date: string };
export function Share() { const [copied, setCopied] = useState(false); return <button className="share-button" onClick={async () => { try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { window.prompt('Copiá el enlace del viaje:', window.location.href); } }}>{copied ? '✓ Enlace copiado' : '↗ Compartir viaje'}</button>; }
export function ExpenseForm({ tripId, members, currency, expense }: { tripId: string; members: Member[]; currency: string; expense?: Expense }) {
 const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
 const [inputCurrency, setInputCurrency] = useState('ARS');
 const [amount, setAmount] = useState(expense ? (expense.amount / 100).toFixed(2) : '');
 const [rate, setRate] = useState<Rate | null>(null);
 const [rateError, setRateError] = useState(false);
 const [retry, setRetry] = useState(0);
 useEffect(() => {
  if (!open || currency !== 'ARS' || inputCurrency !== 'BRL') return;
  const controller = new AbortController(); let cancelled = false;
  const timeout = setTimeout(() => controller.abort(), 10000);
  setRate(null); setRateError(false);
  fetch('https://api.frankfurter.dev/v2/rate/BRL/ARS', { signal: controller.signal })
   .then(response => { if (!response.ok) throw new Error('Cotización no disponible'); return response.json(); })
   .then(data => { if (data.base !== 'BRL' || data.quote !== 'ARS' || !Number.isFinite(data.rate) || data.rate <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) throw new Error('Cotización inválida'); if (!cancelled) setRate({ rate: data.rate, date: data.date }); })
   .catch(() => { if (!cancelled) setRateError(true); })
   .finally(() => clearTimeout(timeout));
  return () => { cancelled = true; clearTimeout(timeout); controller.abort(); };
 }, [open, currency, inputCurrency, retry]);
 const entered = Number(amount);
 const convertedCents = rate && /^\d+(?:\.\d{1,2})?$/.test(amount) && entered > 0 ? Math.round(entered * rate.rate * 100) : 0;
 const conversionValid = !!rate && Number.isSafeInteger(convertedCents) && convertedCents > 0 && convertedCents <= 2147483647;
 async function submit(form: FormData) {
  if (!form.getAll('participants').length) { setError('Elegí al menos una persona.'); return; }
  if (currency === 'ARS' && inputCurrency === 'BRL') {
   if (!conversionValid) { setError('Revisá el importe y la cotización antes de guardar.'); return; }
   form.set('amount', (convertedCents / 100).toFixed(2));
  }
  setBusy(true); setError(''); try { await saveExpense(form); setOpen(false); } catch { setError('No pudimos guardar el gasto. Revisá los datos e intentá de nuevo.'); } finally { setBusy(false); }
 }
 async function remove() { if (!expense || !window.confirm('¿Eliminar este gasto?')) return; setBusy(true); try { const form = new FormData(); form.set('tripId', tripId); form.set('id', expense.id); await deleteExpense(form); setOpen(false); } catch { setError('No pudimos eliminar el gasto. Intentá de nuevo.'); } finally { setBusy(false); } }
 function showForm() { setError(''); setInputCurrency('ARS'); setAmount(expense ? (expense.amount / 100).toFixed(2) : ''); setOpen(true); }
 return <><button className={expense ? 'edit-button' : 'primary add-button'} onClick={showForm}>{expense ? 'Editar' : <>+ Agregar gasto</>}</button>{open && <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false); }}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-heading"><div><div className="eyebrow muted">LAS CUENTAS DEL VIAJE</div><h2 id="modal-title">{expense ? 'Editar gasto' : 'Agregar gasto'}</h2></div><button className="close" aria-label="Cerrar" onClick={() => setOpen(false)}>×</button></div><form action={submit} className="stack"><input type="hidden" name="tripId" value={tripId}/>{expense && <input type="hidden" name="id" value={expense.id}/>}<label>¿En qué gastaron?<input name="description" required maxLength={100} defaultValue={expense?.description} placeholder="Ej. Cena frente al mar" autoFocus /></label>
 {currency === 'ARS' && <label>Moneda del gasto<select value={inputCurrency} onChange={event => { setInputCurrency(event.target.value); setAmount(''); setError(''); }}><option value="ARS">Pesos argentinos (ARS)</option><option value="BRL">Reales brasileños (BRL)</option></select></label>}
 <label>Importe <span className="hint">{currency === 'ARS' ? inputCurrency : currency}</span><input name="amount" required type="number" min="0.01" max={inputCurrency === 'BRL' && currency === 'ARS' ? undefined : '21474836.47'} step="0.01" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0.00" /></label>
 {currency === 'ARS' && inputCurrency === 'BRL' && <div aria-live="polite" className="hint">{rateError ? <>No pudimos obtener la cotización. <button type="button" onClick={() => setRetry(value => value + 1)}>Reintentar</button></> : !rate ? 'Consultando cotización…' : <>{conversionValid ? <>Estimado a guardar: <strong>{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(convertedCents / 100)}</strong></> : amount ? 'El importe convertido debe estar entre $0,01 y $21.474.836,47.' : 'Ingresá un importe para ver el estimado.'}<br/>1 BRL = {new Intl.NumberFormat('es-AR', { maximumFractionDigits: 4 }).format(rate.rate)} ARS · Cotización de referencia {rate.date}, Frankfurter. Se guardará el equivalente en pesos.</>}</div>}
 <label>¿Quién pagó?<select name="payerId" defaultValue={expense?.payerId ?? members[0].id}>{members.map(m => <option value={m.id} key={m.id}>{m.name}</option>)}</select></label><fieldset><legend>¿Entre quiénes se divide?</legend><p className="hint">En partes iguales entre las personas elegidas.</p><div className="checks">{members.map(m => <label key={m.id}><input type="checkbox" name="participants" value={m.id} defaultChecked={expense ? expense.participantIds.includes(m.id) : true}/><span>{m.name}</span></label>)}</div></fieldset>{error && <p className="error" role="alert">{error}</p>}<button className="primary" disabled={busy || (currency === 'ARS' && inputCurrency === 'BRL' && !conversionValid)}>{busy ? 'Guardando…' : 'Guardar gasto'} <span>↗</span></button>{expense && <button type="button" className="delete-button" disabled={busy} onClick={remove}>Eliminar gasto</button>}</form></div></div>}</>;
}
