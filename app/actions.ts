'use server';
import { db } from '@/lib/db';
import { randomBytes } from 'node:crypto';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const value = (form: FormData, key: string) => String(form.get(key) ?? '').trim();
export async function createTrip(form: FormData) {
  const name = value(form, 'name'); const currency = value(form, 'currency');
  const names = [1, 2, 3].map(i => value(form, `member${i}`));
  if (!name || name.length > 80 || names.some(n => !n || n.length > 40) || new Set(names.map(n => n.toLocaleLowerCase())).size !== 3 || !['USD','EUR','ARS','MXN','CLP','COP','UYU'].includes(currency)) throw new Error('Revisá los datos del viaje.');
  const trip = await db.trip.create({ data: { id: randomBytes(24).toString('base64url'), name, currency, members: { create: names.map(name => ({ name })) } } });
  redirect(`/viaje/${trip.id}`);
}
export async function saveExpense(form: FormData) {
  const tripId = value(form, 'tripId'); const id = value(form, 'id'); const description = value(form, 'description');
  const raw = value(form, 'amount').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) throw new Error('Importe inválido');
  const [whole, decimals = ''] = raw.split('.'); const amount = Number(whole) * 100 + Number(decimals.padEnd(2, '0'));
  const payerId = value(form, 'payerId'); const ids = [...new Set(form.getAll('participants').map(String))];
  const trip = await db.trip.findUnique({ where: { id: tripId }, include: { members: true } });
  if (!trip || !description || description.length > 100 || !Number.isSafeInteger(amount) || amount <= 0 || amount > 2147483647 || !ids.length || !trip.members.some(m => m.id === payerId) || ids.some(id => !trip.members.some(m => m.id === id))) throw new Error('Revisá los datos del gasto.');
  if (id) {
    const existing = await db.expense.findFirst({ where: { id, tripId } });
    if (!existing) throw new Error('Gasto no encontrado');
    await db.expense.update({ where: { id }, data: { description, amount, payerId, shares: { deleteMany: {}, create: ids.map(memberId => ({ memberId })) } } });
  } else await db.expense.create({ data: { description, amount, payerId, tripId, shares: { create: ids.map(memberId => ({ memberId })) } } });
  revalidatePath(`/viaje/${tripId}`);
}
export async function deleteExpense(form: FormData) {
  const tripId = value(form, 'tripId'); const id = value(form, 'id');
  await db.expense.deleteMany({ where: { id, tripId } });
  revalidatePath(`/viaje/${tripId}`);
}
