import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-400 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <span className="text-white font-bold text-xl">Ordermind</span>
        </div>
        <Link
          href="/login"
          className="bg-indigo-500 hover:bg-indigo-400 text-white px-5 py-2 rounded-lg font-medium transition-colors text-sm"
        >
          Iniciar sesión
        </Link>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="inline-flex items-center gap-2 bg-indigo-800/50 text-indigo-300 text-sm px-4 py-2 rounded-full mb-8 border border-indigo-700">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          Sistema SaaS para restaurantes
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Pedidos online<br />
          <span className="text-indigo-400">sin complicaciones</span>
        </h1>

        <p className="text-indigo-200 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed">
          Ordermind es la plataforma que necesitas para digitalizar tu restaurante.
          Menú online, pedidos en tiempo real, gestión de entregas y más.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/login"
            className="bg-indigo-500 hover:bg-indigo-400 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
          >
            Acceder al sistema
          </Link>
          <a
            href="#features"
            className="border border-indigo-500 text-indigo-300 hover:bg-indigo-800/50 px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
          >
            Ver características
          </a>
        </div>
      </div>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 pb-24 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '🍽️', title: 'Menú digital', desc: 'Crea y actualiza tu menú al instante con fotos, precios e ingredientes modificables.' },
            { icon: '📱', title: 'Pedidos en tiempo real', desc: 'Recibe pedidos directamente en tu tablet o computadora con notificaciones instantáneas.' },
            { icon: '📊', title: 'Reportes y finanzas', desc: 'Ve tus ventas del día, semana o mes. Exporta reportes y conecta Stripe o PayPal.' },
          ].map((f) => (
            <div key={f.title} className="bg-indigo-900/40 border border-indigo-800 rounded-2xl p-6 text-left backdrop-blur">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-indigo-300 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
