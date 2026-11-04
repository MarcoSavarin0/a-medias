import './style.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'a medias — gastos compartidos', description: 'Las cuentas claras, el viaje liviano.' };
export default function Layout({ children }: { children: React.ReactNode }) { return <html lang="es"><body>{children}</body></html>; }
