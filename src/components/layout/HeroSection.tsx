"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Clock, MapPin, Star } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-red-600 via-red-500 to-orange-500 text-white">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 text-8xl">🌮</div>
        <div className="absolute top-20 right-20 text-7xl">🥪</div>
        <div className="absolute bottom-10 left-1/4 text-6xl">🍔</div>
        <div className="absolute bottom-20 right-10 text-8xl">🌯</div>
        <div className="absolute top-1/2 left-1/2 text-9xl -translate-x-1/2 -translate-y-1/2">
          🌶️
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Star size={14} className="fill-yellow-400 text-yellow-400" />
              <span>El sabor auténtico de México en El Paso</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6 tracking-tight">
              Acá Las
              <br />
              <span className="text-yellow-300">Tortas</span> 🌮
            </h1>

            <p className="text-xl md:text-2xl text-white/85 mb-10 leading-relaxed max-w-xl">
              Las mejores tortas, tacos, hamburguesas y burritos del lado de El
              Paso. Ordena en línea y recoge en minutos.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/menu"
                className="inline-flex items-center justify-center gap-2 bg-white text-red-600 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-yellow-50 transition-colors shadow-lg"
              >
                Ver Menú Completo
                <ArrowRight size={20} />
              </Link>
              <Link
                href="/menu"
                className="inline-flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm border-2 border-white/40 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/30 transition-colors"
              >
                Ordenar Ahora 🔥
              </Link>
            </div>
          </motion.div>

          {/* Info badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-4 mt-12"
          >
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-medium">
              <Clock size={14} />
              <span>Lun–Dom 10am–10pm</span>
            </div>
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-medium">
              <MapPin size={14} />
              <span>El Paso, TX</span>
            </div>
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-medium">
              <span>⭐ 4.9 (500+ reseñas)</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 25C840 30 960 30 1080 25C1200 20 1320 10 1380 5L1440 0V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0Z"
            fill="#fafaf8"
          />
        </svg>
      </div>
    </section>
  );
}
