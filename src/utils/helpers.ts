import { Order } from '../types';

export const STORAGE_KEYS = { orders: 'jastip_orders_v1', customers: 'jastip_customers_v1', unitPrice: 'jastip_unit_price_v1' };
export const MONTH_LABEL_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
export const computeTotal = (kg: number, unitPrice: number) => Math.ceil(Math.max(0, kg)) * unitPrice;
export const todayStr = () => new Date().toISOString().slice(0, 10);
export const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
export function genOrderNo(existing: Order[]) {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const countToday = existing.filter((o) => o.no.includes(ymd)).length + 1;
  return `ORD-${ymd}-${String(countToday).padStart(3, '0')}`;
}
