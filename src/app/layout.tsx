import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ordermind',
  description: 'Sistema de pedidos online para restaurantes',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  )
}
