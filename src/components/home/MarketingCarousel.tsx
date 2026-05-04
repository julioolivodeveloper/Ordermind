'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const SLIDES = [
  '/slides/slide-01.jpg',
  '/slides/slide-02.jpg',
  '/slides/slide-03.jpg',
  '/slides/slide-04.jpg',
  '/slides/slide-05.jpg',
  '/slides/slide-06.jpg',
]

const INTERVAL = 4500

const EASE = [0.32, 0.72, 0, 1] as [number, number, number, number]

const variants = {
  enter: (dir: number) => ({
    x: dir > 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.96,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.55, ease: EASE },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? '-100%' : '100%',
    opacity: 0,
    scale: 0.96,
    transition: { duration: 0.45, ease: EASE },
  }),
}

export function MarketingCarousel() {
  const [[index, dir], setPage] = useState([0, 0])
  const [paused, setPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const startTime = useRef(Date.now())
  const rafRef = useRef<number | null>(null)

  const paginate = useCallback((newDir: number) => {
    setPage(([prev]) => [(prev + newDir + SLIDES.length) % SLIDES.length, newDir])
    startTime.current = Date.now()
    setProgress(0)
  }, [])

  // Progress bar + auto-advance
  useEffect(() => {
    if (paused) { if (rafRef.current) cancelAnimationFrame(rafRef.current); return }

    const tick = () => {
      const elapsed = Date.now() - startTime.current
      const pct = Math.min(elapsed / INTERVAL, 1)
      setProgress(pct)
      if (pct >= 1) {
        paginate(1)
      } else {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [paused, index, paginate])

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') paginate(-1)
      if (e.key === 'ArrowRight') paginate(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [paginate])

  return (
    <section className="bg-[#0a0a0a] py-16 px-4 md:px-12">
      <div className="max-w-2xl mx-auto">
        {/* Carousel frame */}
        <div
          className="relative overflow-hidden rounded-3xl shadow-2xl shadow-lime-500/10 border border-white/8 cursor-grab active:cursor-grabbing select-none"
          style={{ aspectRatio: '1 / 1' }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => { setPaused(false); startTime.current = Date.now() }}
        >
          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <motion.img
              key={index}
              src={SLIDES[index]}
              alt={`Ordermind slide ${index + 1}`}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60) paginate(1)
                else if (info.offset.x > 60) paginate(-1)
              }}
              className="absolute inset-0 w-full h-full object-cover will-change-transform"
            />
          </AnimatePresence>

          {/* Gradient sides for depth */}
          <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black/20 to-transparent pointer-events-none" />

          {/* Arrow buttons */}
          <button
            onClick={() => paginate(-1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/70 hover:scale-110 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => paginate(1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/70 hover:scale-110 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Progress bar */}
          <div className="absolute bottom-0 inset-x-0 h-0.5 bg-white/10 z-20">
            <motion.div
              className="h-full bg-[#a3e635]"
              style={{ width: `${progress * 100}%` }}
              transition={{ ease: 'linear' }}
            />
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2.5 mt-5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => { setPage([i, i > index ? 1 : -1]); startTime.current = Date.now(); setProgress(0) }}
              className="relative flex items-center justify-center"
            >
              <motion.div
                animate={{
                  width: i === index ? 24 : 6,
                  backgroundColor: i === index ? '#a3e635' : 'rgba(255,255,255,0.25)',
                }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="h-1.5 rounded-full"
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
