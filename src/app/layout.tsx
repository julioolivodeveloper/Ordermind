import type { Metadata } from 'next'
import './globals.css'
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ordermindsystem.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Ordermind — Software para Restaurantes',
  description: 'El sistema completo para gestionar tu restaurante online. Menú digital, pedidos, pagos y más.',
  openGraph: {
    title: 'Ordermind — Software para Restaurantes',
    description: 'El sistema completo para gestionar tu restaurante online. Menú digital, pedidos, pagos y más.',
    url: SITE_URL,
    siteName: 'Ordermind',
    images: [
      {
        url: '/dashboard-preview.png',
        width: 1200,
        height: 630,
        alt: 'Ordermind — Panel de administración para restaurantes',
      },
    ],
    locale: 'es_MX',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ordermind — Software para Restaurantes',
    description: 'El sistema completo para gestionar tu restaurante online.',
    images: ['/dashboard-preview.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={cn("h-full", "font-sans", inter.variable)}>
      <body className="h-full antialiased">{children}</body>
    </html>
  )
}
