"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cart-store";
import Link from "next/link";
import { CheckCircle, Home, UtensilsCrossed } from "lucide-react";
import { motion } from "framer-motion";

export default function SuccessPage() {
  const { clearCart } = useCartStore();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle size={48} className="text-green-500" />
        </motion.div>

        <h1 className="text-3xl font-black text-gray-900 mb-3">
          ¡Pedido Confirmado! 🎉
        </h1>
        <p className="text-gray-500 text-lg mb-2">
          Tu orden está en camino a la cocina
        </p>
        <p className="text-gray-400 text-sm mb-8">
          Recibirás un correo de confirmación con los detalles de tu pedido.
          ¡Gracias por preferirnos!
        </p>

        {/* Status steps */}
        <div className="bg-gray-50 rounded-2xl p-5 mb-8">
          <div className="flex items-center justify-between text-sm">
            {[
              { label: "Recibido", emoji: "✅", active: true },
              { label: "En cocina", emoji: "👨‍🍳", active: false },
              { label: "Listo", emoji: "🎯", active: false },
            ].map((step, i) => (
              <div key={step.label} className="flex flex-col items-center gap-1">
                <span
                  className={`text-2xl ${step.active ? "opacity-100" : "opacity-30"}`}
                >
                  {step.emoji}
                </span>
                <span
                  className={`font-medium ${step.active ? "text-gray-900" : "text-gray-400"}`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
          <div className="h-1 bg-gray-200 rounded-full mt-4 relative">
            <div className="h-full bg-green-400 rounded-full w-1/6" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            <Home size={16} /> Inicio
          </Link>
          <Link
            href="/menu"
            className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex-1"
          >
            <UtensilsCrossed size={16} /> Ordenar más
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
