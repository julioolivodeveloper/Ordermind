'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'

const features = [
  {
    icon: '🍽️',
    title: 'Menú digital interactivo',
    desc: 'Crea tu menú con fotos, precios y personalización de ingredientes. Actualiza en segundos.',
    color: 'from-orange-500/20 to-red-500/20',
    border: 'border-orange-500/30',
  },
  {
    icon: '⚡',
    title: 'Pedidos en tiempo real',
    desc: 'Recibe pedidos al instante en tu pantalla. Panel kanban para gestionar cada etapa.',
    color: 'from-indigo-500/20 to-purple-500/20',
    border: 'border-indigo-500/30',
  },
  {
    icon: '📊',
    title: 'Finanzas y reportes',
    desc: 'Ingresos del día, semana y mes. Métodos de pago, platillos más vendidos y más.',
    color: 'from-green-500/20 to-teal-500/20',
    border: 'border-green-500/30',
  },
  {
    icon: '🎨',
    title: 'Marca personalizada',
    desc: 'Colores, logo y dominio propio. Tu restaurante con tu identidad visual.',
    color: 'from-pink-500/20 to-rose-500/20',
    border: 'border-pink-500/30',
  },
  {
    icon: '🚀',
    title: 'Multi-restaurante',
    desc: 'Gestiona varios restaurantes desde un solo panel. Perfecto para cadenas y franquicias.',
    color: 'from-blue-500/20 to-cyan-500/20',
    border: 'border-blue-500/30',
  },
  {
    icon: '🔒',
    title: 'Seguro y confiable',
    desc: 'Datos cifrados, roles por usuario y respaldos automáticos. Tu negocio protegido.',
    color: 'from-violet-500/20 to-purple-500/20',
    border: 'border-violet-500/30',
  },
]

const stats = [
  { value: '< 5 min', label: 'Para estar online' },
  { value: '100%', label: 'Personalizable' },
  { value: '24/7', label: 'Pedidos activos' },
  { value: '0%', label: 'Comisión por venta' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#080818] text-white overflow-x-hidden">

      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[30%] right-[-15%] w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-[-10%] left-[20%] w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2.5"
        >
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Ordermind</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <Link href="/login" className="text-slate-400 hover:text-white text-sm font-medium transition-colors px-4 py-2">
            Iniciar sesión
          </Link>
          <Link
            href="/login"
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105"
          >
            Comenzar gratis →
          </Link>
        </motion.div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs px-4 py-2 rounded-full mb-8 backdrop-blur"
        >
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Plataforma SaaS para restaurantes · Lanzamiento 2026
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.7 }}
          className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-[1.05] tracking-tight"
        >
          Tu restaurante,
          <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            digital y listo.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          Menú online, pedidos en tiempo real, finanzas y más.
          Todo lo que necesitas para vender más sin complicaciones.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/login"
            className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105"
          >
            <span>Empezar ahora</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all backdrop-blur"
          >
            Ver cómo funciona ↓
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto"
        >
          {stats.map((s) => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur hover:bg-white/8 transition-colors">
              <p className="text-2xl md:text-3xl font-black text-white mb-1">{s.value}</p>
              <p className="text-slate-400 text-xs">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Todo lo que necesitas,
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">nada de lo que no.</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Sin mensualidades ocultas. Sin comisiones por pedido. Sin complicaciones técnicas.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
              whileHover={{ y: -6, scale: 1.02 }}
              className={`group relative bg-gradient-to-br ${f.color} border ${f.border} rounded-3xl p-6 backdrop-blur cursor-default transition-all hover:shadow-2xl`}
            >
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border border-indigo-500/30 rounded-3xl p-12 md:p-20 text-center overflow-hidden backdrop-blur"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 pointer-events-none" />
          <h2 className="relative text-4xl md:text-5xl font-black mb-4">
            ¿Listo para modernizar
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">tu restaurante?</span>
          </h2>
          <p className="relative text-slate-300 text-lg mb-8 max-w-lg mx-auto">
            Empieza hoy. En menos de 5 minutos tienes tu menú online listo para recibir pedidos.
          </p>
          <Link
            href="/login"
            className="relative inline-flex items-center gap-2 bg-white text-indigo-900 hover:bg-indigo-50 px-10 py-4 rounded-2xl font-black text-lg transition-all hover:scale-105 shadow-2xl"
          >
            Crear mi restaurante gratis →
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-slate-600 text-sm">
        Ordermind © {new Date().getFullYear()} — Sistema de pedidos para restaurantes
      </footer>
    </main>
  )
}
