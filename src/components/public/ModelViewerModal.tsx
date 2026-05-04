'use client'
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Maximize2, Box, Smartphone } from 'lucide-react'


interface Props {
  open: boolean
  onClose: () => void
  itemName: string
  modelUrl: string
  modelUsdzUrl?: string
  color?: string
}

export function ModelViewerModal({ open, onClose, itemName, modelUrl, modelUsdzUrl, color = '#a3e635' }: Props) {
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent))
  }, [])

  // Load model-viewer script from CDN once when modal opens
  useEffect(() => {
    if (!open) return
    if (document.querySelector('script[data-model-viewer]')) {
      setScriptLoaded(true)
      return
    }
    const script = document.createElement('script')
    script.type = 'module'
    script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js'
    script.dataset.modelViewer = 'true'
    script.onload = () => setScriptLoaded(true)
    document.head.appendChild(script)
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-x-4 bottom-4 top-16 z-50 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg sm:h-[600px] flex flex-col bg-[#111] rounded-3xl overflow-hidden shadow-2xl border border-white/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
                  <Box className="w-4 h-4" style={{ color }} />
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-none">{itemName}</p>
                  <p className="text-white/40 text-xs mt-0.5">3D Preview</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl text-white/30 hover:text-white hover:bg-white/5 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Viewer */}
            <div className="flex-1 relative bg-[#0a0a0a]">
              {!scriptLoaded ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-2 border-white/10 rounded-full animate-spin" style={{ borderTopColor: color }} />
                  <p className="text-white/30 text-sm">Loading 3D model…</p>
                </div>
              ) : React.createElement('model-viewer', {
                  src: modelUrl,
                  'ios-src': modelUsdzUrl,
                  alt: itemName,
                  ar: true,
                  'ar-modes': 'webxr scene-viewer quick-look',
                  'auto-rotate': true,
                  'camera-controls': true,
                  'shadow-intensity': '1',
                  exposure: '1',
                  'environment-image': 'neutral',
                  loading: 'eager',
                  style: { width: '100%', height: '100%', backgroundColor: 'transparent' },
                })}
            </div>

            {/* Footer hints */}
            <div className="px-5 py-3 border-t border-white/8 shrink-0 flex items-center justify-between">
              <p className="text-white/25 text-xs flex items-center gap-1.5">
                <Maximize2 className="w-3 h-3" />
                Drag to rotate · Pinch to zoom
              </p>
              {(modelUsdzUrl || !isIOS) && (
                <p className="text-white/25 text-xs flex items-center gap-1.5">
                  <Smartphone className="w-3 h-3" />
                  Tap AR to place on table
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
