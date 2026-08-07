import type { Metadata } from 'next'
import Script from 'next/script'
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
        url: '/dashboard-preview.jpg',
        width: 1200,
        height: 630,
        alt: 'Ordermind Dashboard',
      },
    ],
    locale: 'es_MX',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ordermind — Software para Restaurantes',
    description: 'El sistema completo para gestionar tu restaurante online.',
    images: ['/dashboard-preview.jpg'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={cn("h-full", "font-sans", inter.variable)}>
      <body className="h-full antialiased">
        {children}

        {/* Meta Pixel */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1240873181038169');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img height="1" width="1" style={{display:'none'}}
            src="https://www.facebook.com/tr?id=1240873181038169&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
      </body>
    </html>
  )
}
