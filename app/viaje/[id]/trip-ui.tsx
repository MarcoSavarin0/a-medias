'use client';
import { useEffect, useState, useRef, useId } from 'react';
import { saveExpense, deleteExpense } from '@/app/actions';
type Member = { id: string; name: string };
type Expense = { id: string; description: string; amount: number; payerId: string; participantIds: string[] };
type Rate = { rate: number; updatedAt: string };
export function Share() { const [copied, setCopied] = useState(false); return <button className="share-button" onClick={async () => { try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { window.prompt('Copiá el enlace del viaje:', window.location.href); } }}>{copied ? '✓ Enlace copiado' : 'Copiar enlace del viaje'}</button>; }
export function ExpenseForm({ tripId, members, currency, expense }: { tripId: string; members: Member[]; currency: string; expense?: Expense }) {
 const dialogRef = useRef<HTMLDialogElement>(null);
 const triggerRef = useRef<HTMLButtonElement>(null);
 const titleId = useId();
 const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
 const [inputCurrency, setInputCurrency] = useState('ARS');
 const [amount, setAmount] = useState(expense ? (expense.amount / 100).toFixed(2) : '');
 const [paymentMethod, setPaymentMethod] = useState('mercado-pago');
 const [paidPesos, setPaidPesos] = useState('');
 const [rate, setRate] = useState<Rate | null>(null);
 const [rateError, setRateError] = useState(false);
 const [retry, setRetry] = useState(0);
 useEffect(() => {
  if (!open || currency !== 'ARS' || inputCurrency !== 'BRL') return;
  const controller = new AbortController(); let cancelled = false;
  const timeout = setTimeout(() => controller.abort(), 10000);
  setRate(null); setRateError(false);
  fetch(paymentMethod === 'efectivo' ? 'https://api.frankfurter.dev/v2/rate/BRL/ARS' : '/api/pix', { signal: controller.signal, cache: 'no-store' })
   .then(response => { if (!response.ok) throw new Error('Cotización no disponible'); return response.json(); })
   .then(data => { const updatedAt = paymentMethod === 'efectivo' ? data.date : data.updatedAt; if ((paymentMethod === 'efectivo' && (data.base !== 'BRL' || data.quote !== 'ARS' || !/^\d{4}-\d{2}-\d{2}$/.test(data.date))) || !Number.isFinite(data.rate) || data.rate <= 0 || !Number.isFinite(Date.parse(updatedAt))) throw new Error('Cotización inválida'); if (!cancelled) setRate({ rate: data.rate, updatedAt }); })
   .catch(() => { if (!cancelled) setRateError(true); })
   .finally(() => clearTimeout(timeout));
  return () => { cancelled = true; clearTimeout(timeout); controller.abort(); };
 }, [open, currency, inputCurrency, paymentMethod, retry]);
 useEffect(() => {
  if (!open) return;
  const dialog = dialogRef.current;
  dialog?.showModal();
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  return () => { dialog?.close(); document.body.style.overflow = previousOverflow; triggerRef.current?.focus(); };
 }, [open]);
 const entered = Number(amount);
 const convertedCents = rate && /^\d+(?:\.\d{1,2})?$/.test(amount) && entered > 0 ? Math.round(entered * rate.rate * 100) : 0;
 const manualCents = /^\d+(?:\.\d{1,2})?$/.test(paidPesos) ? Math.round(Number(paidPesos) * 100) : 0;
 const finalCents = paidPesos ? manualCents : paymentMethod === 'galicia' ? 0 : convertedCents;
 const conversionValid = /^\d+(?:\.\d{1,2})?$/.test(amount) && entered > 0 && (paidPesos ? manualCents > 0 : paymentMethod !== 'galicia' && !!rate) && Number.isSafeInteger(finalCents) && finalCents > 0 && finalCents <= 2147483647;
 async function submit(form: FormData) {
  if (!form.getAll('participants').length) { setError('Elegí al menos una persona.'); return; }
  if (currency === 'ARS' && inputCurrency === 'BRL') {
   if (!conversionValid) { setError('Revisá el importe y la cotización antes de guardar.'); return; }
   form.set('amount', (finalCents / 100).toFixed(2));
  }
  setBusy(true); setError(''); try { await saveExpense(form); setOpen(false); } catch { setError('No pudimos guardar el gasto. Revisá los datos e intentá de nuevo.'); } finally { setBusy(false); }
 }
 async function remove() { if (!expense || !window.confirm('¿Eliminar este gasto? Se quitará del total y se volverán a calcular las cuentas.')) return; setBusy(true); try { const form = new FormData(); form.set('tripId', tripId); form.set('id', expense.id); await deleteExpense(form); setOpen(false); } catch { setError('No pudimos eliminar el gasto. Intentá de nuevo.'); } finally { setBusy(false); } }
 function showForm() { setError(''); setInputCurrency('ARS'); setRate(null); setRateError(false); setPaymentMethod('mercado-pago'); setPaidPesos(''); setAmount(expense ? (expense.amount / 100).toFixed(2) : ''); setOpen(true); }
 return <><button ref={triggerRef} className={expense ? 'edit-button' : 'primary add-button'} onClick={showForm}>{expense ? 'Editar gasto' : <>+ Agregar gasto</>}</button>{open && <dialog ref={dialogRef} className="modal" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); if (!busy) setOpen(false); }}><div className="modal-heading"><div><div className="eyebrow muted">LAS CUENTAS DEL VIAJE</div><h2 id={titleId} tabIndex={-1} autoFocus>{expense ? 'Editar gasto' : 'Agregar gasto'}</h2></div><button className="close" disabled={busy} aria-label="Cerrar formulario" onClick={() => setOpen(false)}>×</button></div><form action={submit} className="stack"><input type="hidden" name="tripId" value={tripId}/>{expense && <input type="hidden" name="id" value={expense.id}/>}<label>Descripción del gasto<input name="description" required maxLength={100} defaultValue={expense?.description} placeholder="Ej. Cena frente al mar" /></label>
 {currency === 'ARS' && <label>Moneda del gasto<select value={inputCurrency} onChange={event => { setInputCurrency(event.target.value); setRate(null); setRateError(false); setAmount(''); setError(''); }}><option value="ARS">Pesos argentinos (ARS)</option><option value="BRL">Reales brasileños (BRL)</option></select></label>}
 <label>Importe <span className="hint">{currency === 'ARS' ? inputCurrency : currency}</span><input name="amount" required type="number" inputMode="decimal" min="0.01" max={inputCurrency === 'BRL' && currency === 'ARS' ? undefined : '21474836.47'} step="0.01" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0.00" /></label>
 {currency === 'ARS' && inputCurrency === 'BRL' && <><label>¿Con qué pagaste?<select value={paymentMethod} onChange={event => { setPaymentMethod(event.target.value); setRate(null); setRateError(false); setPaidPesos(''); setError(''); }}><option value="mercado-pago">Mercado Pago con Pix</option><option value="galicia">Banco Galicia con Pix</option><option value="efectivo">Efectivo</option></select></label>
 <label>Importe debitado en pesos (ARS)<span className="hint">{paymentMethod === 'galicia' ? 'Ingresá el importe que muestra Galicia para este pago.' : paymentMethod === 'efectivo' ? 'Opcional: ingresá lo que te costaron esos reales en pesos.' : 'Opcional: corregí el estimado con el importe que muestra Mercado Pago.'}</span><input type="number" inputMode="decimal" min="0.01" max="21474836.47" step="0.01" required={paymentMethod === 'galicia'} value={paidPesos} onChange={event => setPaidPesos(event.target.value)} placeholder="0.00" /></label>
 <div aria-live="polite" className="hint">{rateError ? <>No pudimos obtener la cotización. <button type="button" onClick={() => setRetry(value => value + 1)}>Reintentar</button></> : !rate ? 'Consultando cotización…' : <>{paymentMethod === 'efectivo' ? 'Efectivo estimado: ' : 'Mercado Pago estimado: '}{convertedCents > 0 && Number.isSafeInteger(convertedCents) ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(convertedCents / 100) : 'ingresá un importe en reales'}<br/>1 BRL = {new Intl.NumberFormat('es-AR', { maximumFractionDigits: 4 }).format(rate.rate)} ARS · {paymentMethod === 'efectivo' ? <>Frankfurter, {rate.updatedAt}</> : <>ComparaPix, {new Date(rate.updatedAt).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</>}.</>}
 {paymentMethod === 'galicia' && manualCents > 0 && rate && convertedCents > 0 && Number.isSafeInteger(convertedCents) && <><br/>Diferencia Galicia frente al estimado de Mercado Pago: {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', signDisplay: 'always' }).format((manualCents - convertedCents) / 100)}.</>}
 <br/>Se guardará {paidPesos ? 'el importe en pesos ingresado' : paymentMethod === 'efectivo' ? 'el estimado en pesos' : 'el estimado de Mercado Pago'} en pesos. {paymentMethod === 'efectivo' ? 'La cotización es de referencia y puede diferir del cambio que conseguiste.' : 'Confirmá el importe final en la app antes de pagar.'}</div></>}
 <label>¿Quién pagó?<select name="payerId" defaultValue={expense?.payerId ?? members[0].id}>{members.map(m => <option value={m.id} key={m.id}>{m.name}</option>)}</select></label><fieldset><legend>¿Entre quiénes se divide?</legend><p className="hint">Marcá las personas que comparten este gasto, incluida la que pagó si le corresponde una parte. Se divide en partes iguales.</p><div className="checks">{members.map(m => <label key={m.id}><input type="checkbox" name="participants" value={m.id} defaultChecked={expense ? expense.participantIds.includes(m.id) : true}/><span>{m.name}</span></label>)}</div></fieldset>{error && <p className="error" role="alert">{error}</p>}<button className="primary" disabled={busy || (currency === 'ARS' && inputCurrency === 'BRL' && !conversionValid)}>{busy ? 'Guardando…' : 'Guardar gasto'} <span>↗</span></button><button type="button" className="share-button" disabled={busy} onClick={() => setOpen(false)}>Cancelar</button>{expense && <button type="button" className="delete-button" disabled={busy} onClick={remove}>Eliminar gasto</button>}</form></dialog>}</>;
}
