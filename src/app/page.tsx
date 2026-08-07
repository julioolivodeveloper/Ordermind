'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import {
  CheckCircle2, Zap, Shield, UtensilsCrossed, CreditCard,
  Bike, LayoutDashboard, Tag, Cloud, Headphones, Lock,
  TrendingUp, MessageCircle, ArrowRight, Banknote
} from 'lucide-react'

const WORDS = ['Restaurantes', 'Taquerías', 'Cafeterías', 'Pizzerías', 'Fondas', 'Bares', 'Pastelerías']

function Typewriter() {
  const [wordIndex, setWordIndex] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const word = WORDS[wordIndex]
    let timeout: ReturnType<typeof setTimeout>

    if (!deleting && displayed.length < word.length) {
      timeout = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 80)
    } else if (!deleting && displayed.length === word.length) {
      timeout = setTimeout(() => setDeleting(true), 1800)
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 45)
    } else if (deleting && displayed.length === 0) {
      setDeleting(false)
      setWordIndex((i) => (i + 1) % WORDS.length)
    }

    return () => clearTimeout(timeout)
  }, [displayed, deleting, wordIndex])

  return (
    <span className="text-[#a3e635]">
      {displayed}
      <span className="animate-pulse">|</span>
    </span>
  )
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
}

const features = [
  {
    icon: UtensilsCrossed,
    title: 'Menú Digital',
    desc: 'Menú atractivo, fácil de usar y siempre actualizado.',
  },
  {
    icon: CreditCard,
    title: 'Recibe Pagos Online',
    desc: 'Acepta tarjetas y pagos digitales de forma segura.',
  },
  {
    icon: Bike,
    title: 'Pedidos Online Pickup o Delivery',
    desc: 'Tus clientes piden y tú gestionas todo desde un solo lugar.',
  },
  {
    icon: LayoutDashboard,
    title: 'Panel de Administración',
    desc: 'Control total de tu restaurante desde cualquier dispositivo.',
  },
  {
    icon: Tag,
    title: 'Cupones de Descuento y Ofertas',
    desc: 'Atrae más clientes y aumenta tus ventas.',
  },
]

const checklist = [
  'Ahorra tiempo',
  'Reduce errores',
  'Mejora la experiencia de tus clientes',
  'Toma mejores decisiones con reportes en tiempo real',
]

const footerItems = [
  { icon: Cloud, title: 'Acceso en la Nube', desc: 'Desde cualquier lugar y dispositivo.' },
  { icon: Headphones, title: 'Soporte Dedicado', desc: 'Estamos contigo en cada paso.' },
  { icon: Lock, title: '100% Seguro', desc: 'Protegemos tu información y la de tus clientes.' },
  { icon: TrendingUp, title: 'Diseñado para Hacer Crecer tu Negocio', desc: '' },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-5 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2.5"
        >
          <div className="w-9 h-9 bg-[#a3e635] rounded-xl flex items-center justify-center shadow-lg shadow-lime-500/30">
            <span className="text-black font-black text-sm">O</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Ordermind</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <a
            href="https://wa.me/12094609828"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#a3e635] hover:bg-lime-400 text-black px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-lime-500/20 hover:scale-105"
          >
            Comenzar
          </a>
        </motion.div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">

        <div className="absolute inset-0">
          <img
            src="/dashboard-preview.jpg"
            alt=""
            className="w-full h-full object-cover opacity-30 object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/90 to-[#0a0a0a]/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-6 pb-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">

          <div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7 }}
              className="text-5xl md:text-7xl font-black leading-[0.95] tracking-tight mb-6 uppercase"
            >
              Menú Digital
              <br />
              <span className="text-white">para</span>
              <br />
              <Typewriter />
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-[#a3e635]/10 border border-[#a3e635]/30 rounded-full px-4 py-1.5 mb-5"
            >
              <span className="w-2 h-2 rounded-full bg-[#a3e635] animate-pulse" />
              <span className="text-[#a3e635] text-sm font-bold tracking-wide">Tu propio sistema — 100% tuyo</span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-slate-300 text-lg mb-8 leading-relaxed max-w-lg"
            >
              El sistema completo para gestionar tu restaurante{' '}
              <span className="text-[#a3e635] font-bold">online</span> de forma{' '}
              <span className="text-[#a3e635] font-bold">automatizada.</span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex flex-wrap gap-3 mb-10"
            >
              {[
                { icon: CheckCircle2, label: 'Fácil' },
                { icon: Zap, label: 'Rápido' },
                { icon: Shield, label: 'Seguro' },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 border border-white/20 rounded-full px-5 py-2 text-sm font-bold text-white bg-white/5 backdrop-blur"
                >
                  <Icon className="w-4 h-4 text-[#a3e635]" />
                  {label}
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <a
                href="https://wa.me/12094609828"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#a3e635] hover:bg-lime-400 text-black px-8 py-4 rounded-2xl font-black text-lg transition-all hover:scale-105 shadow-xl shadow-lime-500/20"
              >
                Comenzar ahora <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="https://wa.me/12094609828"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all"
              >
                <MessageCircle className="w-5 h-5 text-green-400" />
                WhatsApp
              </a>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="hidden lg:block relative"
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-[#a3e635]/10 rounded-3xl blur-2xl" />
              <img
                src="/dashboard-preview.jpg"
                alt="Dashboard Ordermind"
                className="relative rounded-2xl shadow-2xl border border-white/10 w-full object-cover"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="bg-white pt-10 pb-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                className="flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#a3e635]/15 border border-[#a3e635]/30 flex items-center justify-center mb-4">
                  <f.icon className="w-7 h-7 text-[#5a8a00]" strokeWidth={1.5} />
                </div>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight mb-2 leading-snug">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAYMENTS ── */}
      <section className="bg-[#0a0a0a] py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-widest mb-3">Pagos seguros</p>
            <h2 className="text-3xl md:text-4xl font-black text-white">
              Conecta tu procesador de pagos favorito
            </h2>
            <p className="text-slate-400 mt-3 max-w-xl mx-auto">
              Acepta tarjetas de crédito y débito con las plataformas más confiables del mercado.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center gap-4 hover:border-[#635BFF]/50 hover:bg-[#635BFF]/5 transition-all"
            >
              <div className="h-10 flex items-center justify-center">
                <span className="text-3xl font-black tracking-tight" style={{ color: '#635BFF', fontFamily: 'sans-serif' }}>stripe</span>
              </div>
              <div className="text-center">
                <p className="text-white font-bold">Stripe</p>
                <p className="text-slate-400 text-sm mt-1">Pagos globales, suscripciones y más</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-1">
                {['Visa', 'Mastercard', 'Amex', 'Apple Pay'].map(m => (
                  <span key={m} className="text-xs bg-white/10 text-slate-300 px-2.5 py-1 rounded-full">{m}</span>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center gap-4 hover:border-white/30 hover:bg-white/8 transition-all"
            >
              <svg viewBox="0 0 24 24" className="h-10 w-10" fill="white">
                <rect x="0" y="0" width="24" height="24" rx="4" fill="white"/>
                <rect x="5" y="5" width="14" height="14" rx="2" fill="black"/>
              </svg>
              <div className="text-center">
                <p className="text-white font-bold">Square</p>
                <p className="text-slate-400 text-sm mt-1">POS, pagos online y gestión de catálogo</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-1">
                {['Visa', 'Mastercard', 'Débito', 'POS físico'].map(m => (
                  <span key={m} className="text-xs bg-white/10 text-slate-300 px-2.5 py-1 rounded-full">{m}</span>
                ))}
              </div>
            </motion.div>
            {/* Paga en Caja */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center gap-4 hover:border-[#a3e635]/50 hover:bg-[#a3e635]/5 transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#a3e635]/10 border border-[#a3e635]/20 flex items-center justify-center">
                <Banknote className="w-8 h-8 text-[#a3e635]" />
              </div>
              <div className="text-center">
                <p className="text-white font-bold">Paga en Caja</p>
                <p className="text-slate-400 text-sm mt-1">El cliente ordena online y paga al recoger</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-1">
                {['Efectivo', 'Sin tarjeta', 'Pick-up'].map(m => (
                  <span key={m} className="text-xs bg-white/10 text-slate-300 px-2.5 py-1 rounded-full">{m}</span>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center text-slate-600 text-xs mt-8"
          >
            Todos los pagos son procesados directamente por Stripe o Square — Ordermind nunca toca tu dinero.
          </motion.p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-[#0a0a0a] py-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-4xl md:text-6xl font-black uppercase leading-[0.95] mb-6">
              Transforma tu
              <br />
              restaurante
              <br />
              <span className="text-[#a3e635]">¡Vende más!</span>
            </h2>

            <div className="w-24 h-1.5 bg-[#a3e635] rounded-full mb-8" />

            <ul className="space-y-4 mb-10">
              {checklist.map((item) => (
                <li key={item} className="flex items-center gap-3 text-slate-300 text-base">
                  <CheckCircle2 className="w-5 h-5 text-[#a3e635] shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <a
              href="https://wa.me/12094609828"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-[#a3e635] hover:bg-lime-400 text-black px-8 py-4 rounded-2xl font-black text-lg transition-all hover:scale-105 shadow-xl shadow-lime-500/20"
            >
              <MessageCircle className="w-6 h-6" />
              Solicita tu Demo Gratis
            </a>
            <p className="text-slate-500 text-sm mt-4">Y lleva tu restaurante al siguiente nivel.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative flex justify-center"
          >
            <div className="absolute inset-0 bg-[#a3e635]/10 rounded-full blur-3xl scale-110" />
            <div className="relative w-full max-w-xs md:max-w-sm">
              <img
                src="/restaurante-persona.jpg"
                alt="Dueño de restaurante usando Ordermind"
                className="relative rounded-3xl shadow-2xl w-full object-cover object-top"
                style={{ aspectRatio: '3/4' }}
              />
              <div className="absolute bottom-5 right-4 bg-[#a3e635] text-black rounded-2xl px-4 py-3 shadow-2xl">
                <p className="font-black text-xs uppercase leading-tight text-center">
                  Más Control<br />Más Ventas<br />Más Clientes
                </p>
                <div className="flex justify-center mt-1 text-black text-xs tracking-wider">★★★★★</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#a3e635] py-12 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {footerItems.map((item, i) => (
            <motion.div
              key={item.title}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
              className="flex flex-col items-center text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-black/10 flex items-center justify-center mb-3">
                <item.icon className="w-7 h-7 text-black" strokeWidth={1.5} />
              </div>
              <h4 className="font-black text-black text-xs uppercase tracking-tight leading-snug mb-1">{item.title}</h4>
              {item.desc && <p className="text-black/60 text-xs">{item.desc}</p>}
            </motion.div>
          ))}
        </div>
        <div className="mt-10 text-center text-black/50 text-xs">
          Ordermind © {new Date().getFullYear()} — Sistema de pedidos para restaurantes
        </div>
      </footer>
    </main>
  )
}
