import type { Metadata } from 'next'
import Header from '@/components/acatortas/Header'

export const metadata: Metadata = {
  title: '¡Acá Las Tortas! El Paso — Pedidos Online',
  description: 'Las mejores tortas de El Paso. Ordena en línea para pickup o delivery.',
}

export default function AcaTortasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {children}
    </div>
  )
}
