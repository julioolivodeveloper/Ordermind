'use client'
import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import { Download, Copy, Check } from 'lucide-react'

export function QRCodeCard({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false)
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/r/${slug}`
    : `https://ordermind.app/r/${slug}`

  function copy() {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function download() {
    const svg = document.getElementById('menu-qr')
    if (!svg) return
    const data = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([data], { type: 'image/svg+xml' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `qr-menu-${slug}.svg`
    a.click()
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white">QR de tu menú</h2>
        <p className="text-white/40 text-sm mt-0.5">Imprímelo en tus mesas, empaque o volantes</p>
      </div>

      <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4 w-fit">
        <QRCodeSVG
          id="menu-qr"
          value={url}
          size={200}
          level="H"
          includeMargin
        />
        <p className="text-slate-500 text-xs text-center max-w-[200px] break-all">{url}</p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={download}
          className="flex items-center gap-2 bg-[#a3e635] hover:bg-lime-400 text-black px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
        >
          <Download className="w-4 h-4" />
          Descargar SVG
        </button>
        <button
          onClick={copy}
          className="flex items-center gap-2 border border-white/10 text-white/60 hover:text-white hover:border-white/20 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
        >
          {copied ? <Check className="w-4 h-4 text-[#a3e635]" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copiado' : 'Copiar enlace'}
        </button>
      </div>
    </div>
  )
}
