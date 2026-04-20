"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cart-store";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, ShoppingBag, Lock, CheckCircle } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

type PaymentStep = "idle" | "validating" | "processing" | "approved";

const STEP_MESSAGES: Record<PaymentStep, { text: string; sub: string }> = {
  idle: { text: "", sub: "" },
  validating: { text: "Validando información...", sub: "Verificando tus datos de contacto" },
  processing: { text: "Procesando pago...", sub: "Comunicando con el banco de forma segura" },
  approved: { text: "¡Pago aprobado!", sub: "Redirigiendo a tu confirmación..." },
};

export default function CheckoutPage() {
  const { items, total } = useCartStore();
  const router = useRouter();
  const [step, setStep] = useState<PaymentStep>("idle");
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });

  const cartTotal = total();
  const isProcessing = step !== "idle";

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <span className="text-6xl block mb-4">🛒</span>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tu carrito está vacío</h2>
        <Link href="/menu" className="inline-flex items-center gap-2 text-red-500 font-semibold mt-4">
          <ArrowLeft size={16} /> Volver al menú
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    // Step 1 — validating (0.8s)
    setStep("validating");
    await delay(800);

    // Step 2 — processing (2s) + save order to Supabase
    setStep("processing");
    try {
      await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, customer: form }),
      });
    } catch {
      // continue even if DB save fails — simulation always succeeds
    }
    await delay(2000);

    // Step 3 — approved (1s)
    setStep("approved");
    await delay(1000);

    router.push("/success");
  };

  const inputClass =
    "w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 transition-colors text-gray-900 placeholder-gray-400";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
      {/* Payment processing overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-white rounded-3xl p-10 w-full max-w-sm text-center shadow-2xl"
            >
              {step === "approved" ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 12 }}
                  className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle size={40} className="text-green-500" />
                </motion.div>
              ) : (
                <div className="relative w-20 h-20 mx-auto mb-6">
                  {/* Outer ring */}
                  <svg className="w-20 h-20 animate-spin" viewBox="0 0 80 80">
                    <circle
                      cx="40" cy="40" r="34"
                      fill="none" stroke="#fee2e2" strokeWidth="6"
                    />
                    <circle
                      cx="40" cy="40" r="34"
                      fill="none" stroke="#ef4444" strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray="53 161"
                    />
                  </svg>
                  {/* Center icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lock size={22} className="text-red-500" />
                  </div>
                </div>
              )}

              <motion.h3
                key={step}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl font-black text-gray-900 mb-2"
              >
                {STEP_MESSAGES[step].text}
              </motion.h3>
              <motion.p
                key={`${step}-sub`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-gray-400 text-sm"
              >
                {STEP_MESSAGES[step].sub}
              </motion.p>

              {/* Progress dots */}
              {step !== "approved" && (
                <div className="flex justify-center gap-2 mt-6">
                  {(["validating", "processing"] as const).map((s) => (
                    <div
                      key={s}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        s === step ? "bg-red-500 scale-125" : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-8">
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium mb-4 transition-colors"
        >
          <ArrowLeft size={16} /> Seguir comprando
        </Link>
        <h1 className="text-3xl font-black text-gray-900">Finalizar Pedido</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg mb-5 flex items-center gap-2">
                <span>📋</span> Tus Datos
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre completo</label>
                  <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Juan García" required className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Correo electrónico</label>
                  <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="juan@ejemplo.com" required className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Teléfono</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="(915) 555-0100" required className={inputClass} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                <span>📝</span> Notas del pedido (opcional)
              </h2>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Sin cebolla, extra picante, etc."
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Fake card input — visual only */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg mb-5 flex items-center gap-2">
                <CreditCard size={18} className="text-red-500" /> Información de Pago
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Número de tarjeta</label>
                  <input type="text" defaultValue="4242 4242 4242 4242" readOnly className={`${inputClass} bg-gray-50 cursor-default font-mono tracking-widest`} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Vencimiento</label>
                    <input type="text" defaultValue="12/28" readOnly className={`${inputClass} bg-gray-50 cursor-default font-mono`} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">CVV</label>
                    <input type="text" defaultValue="•••" readOnly className={`${inputClass} bg-gray-50 cursor-default font-mono`} />
                  </div>
                </div>
              </div>
              <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg mt-4 flex items-center gap-2">
                <span>⚠️</span> Modo demo — no se realiza ningún cargo real
              </p>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white py-4 rounded-2xl font-bold text-lg transition-colors shadow-lg shadow-red-200 disabled:shadow-none"
            >
              <Lock size={18} />
              Pagar ${(cartTotal * 1.0825).toFixed(2)}
            </button>

            <p className="text-center text-xs text-gray-400">
              🔒 Simulación de pago seguro. No se realiza ningún cargo.
            </p>
          </form>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
            <h2 className="font-bold text-gray-900 text-lg mb-5 flex items-center gap-2">
              <ShoppingBag size={18} className="text-red-500" />
              Resumen del pedido
            </h2>

            <ul className="space-y-3 mb-5">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 leading-tight">{item.name}</p>
                    <p className="text-xs text-gray-400">x{item.quantity}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-900 shrink-0">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="border-t border-gray-100 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Impuesto (~8.25%)</span>
                <span>${(cartTotal * 0.0825).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-gray-900 text-lg pt-2 border-t border-gray-100">
                <span>Total</span>
                <span>${(cartTotal * 1.0825).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
