export type Member = { id: string; name: string };
export type Expense = { amount: number; payerId: string; shares: { memberId: string }[] };
export function calculate(members: Member[], expenses: Expense[]) {
  const balances = new Map(members.map(m => [m.id, 0]));
  for (const expense of expenses) {
    balances.set(expense.payerId, (balances.get(expense.payerId) ?? 0) + expense.amount);
    const ids = expense.shares.map(s => s.memberId).sort();
    ids.forEach((id, index) => balances.set(id, (balances.get(id) ?? 0) - Math.floor(expense.amount / ids.length) - (index < expense.amount % ids.length ? 1 : 0)));
  }
  const debtors = members.map(m => ({ ...m, amount: -(balances.get(m.id) ?? 0) })).filter(m => m.amount > 0);
  const creditors = members.map(m => ({ ...m, amount: balances.get(m.id) ?? 0 })).filter(m => m.amount > 0);
  const transfers: { from: string; to: string; amount: number }[] = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount);
    transfers.push({ from: debtors[i].name, to: creditors[j].name, amount });
    debtors[i].amount -= amount; creditors[j].amount -= amount;
    if (!debtors[i].amount) i++; if (!creditors[j].amount) j++;
  }
  return { balances, transfers };
}
export const money = (amount: number, currency: string) => new Intl.NumberFormat('es', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount / 100);
