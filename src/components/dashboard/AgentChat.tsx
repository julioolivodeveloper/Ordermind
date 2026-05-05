'use client'
import { useState, useRef, useEffect } from 'react'
import { X, Send, Sparkles, ImagePlus, Loader2 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  imageUrl?: string
}

export function AgentChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Soy tu asistente de IA. Puedo ayudarte a gestionar tu menú, crear promociones, ver estadísticas y más. ¿En qué te ayudo?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingImage, setPendingImage] = useState<{ file: File; url: string } | null>(null)
  const [needsImage, setNeedsImage] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleImageSelect(file: File) {
    const localUrl = URL.createObjectURL(file)
    setPendingImage({ file, url: localUrl })
    setNeedsImage(false)
  }

  async function uploadImage(file: File): Promise<string | null> {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/dashboard/agent/upload', { method: 'POST', body: fd })
    const data = await res.json()
    return data.url ?? null
  }

  async function sendMessage() {
    const text = input.trim()
    if (!text && !pendingImage) return

    let imageUrl: string | null = null
    if (pendingImage) {
      imageUrl = await uploadImage(pendingImage.file)
      setPendingImage(null)
    }

    const userMsg: Message = { role: 'user', content: text || '(imagen adjunta)', imageUrl: imageUrl ?? undefined }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/dashboard/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          imageUrl,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      setNeedsImage(data.needs_image ?? false)
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.message}` }])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const suggestions = [
    '¿Cuáles son mis ventas de esta semana?',
    'Agrega un nuevo platillo al menú',
    'Crea un cupón de 10% de descuento',
    'Muestra mis platillos más populares',
  ]

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all ${open ? 'scale-0 opacity-0' : 'scale-100 opacity-100'} bg-gradient-to-br from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500`}
      >
        <Sparkles className="w-6 h-6 text-white" />
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[580px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-violet-500 to-indigo-600 shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">Asistente IA</p>
              <p className="text-white/70 text-xs">Gestiona tu restaurante con IA</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white p-1 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-bl-sm'}`}>
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="" className="rounded-lg mb-2 max-h-32 object-cover w-full" />
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-slate-100 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                  <span className="text-sm text-slate-500">Pensando...</span>
                </div>
              </div>
            )}

            {/* Suggestions — only on first message */}
            {messages.length === 1 && !loading && (
              <div className="space-y-2 pt-1">
                {suggestions.map(s => (
                  <button key={s} onClick={() => { setInput(s); setTimeout(() => sendMessage(), 50) }} className="w-full text-left text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Image preview */}
          {pendingImage && (
            <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-3">
              <img src={pendingImage.url} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
              <p className="text-xs text-slate-600 flex-1">Imagen lista para enviar</p>
              <button onClick={() => setPendingImage(null)} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* Needs image prompt */}
          {needsImage && (
            <div className="px-4 py-2 bg-indigo-50 border-t border-indigo-100 flex items-center gap-2">
              <ImagePlus className="w-4 h-4 text-indigo-500 shrink-0" />
              <p className="text-xs text-indigo-700 flex-1">El agente necesita una imagen</p>
              <button onClick={() => fileRef.current?.click()} className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg font-medium">Adjuntar</button>
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 bg-white border-t border-slate-100 flex items-end gap-2 shrink-0">
            <button onClick={() => fileRef.current?.click()} className="text-slate-400 hover:text-indigo-500 p-2 transition-colors shrink-0">
              <ImagePlus className="w-5 h-5" />
            </button>
            <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageSelect(f) }} />
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Escribe un mensaje... (Enter para enviar)"
              rows={1}
              className="flex-1 resize-none border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 max-h-24"
            />
            <button
              onClick={sendMessage}
              disabled={loading || (!input.trim() && !pendingImage)}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white p-2 rounded-xl transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
