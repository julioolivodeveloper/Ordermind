"use client";

import { useCartStore } from "@/store/cart-store";
import { X, ShoppingBag, Trash2, Plus, Minus } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export function CartDrawer() {
  const { isOpen, closeCart, items, total, updateQuantity, removeItem, itemCount } =
    useCartStore();

  const count = itemCount();
  const cartTotal = total();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-red-500" />
                <h2 className="font-bold text-gray-900 text-lg">
                  Tu Carrito
                </h2>
                {count > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {count}
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
                  <span className="text-6xl">🛒</span>
                  <p className="text-gray-500 font-medium">Tu carrito está vacío</p>
                  <p className="text-gray-400 text-sm">
                    ¡Agrega algo delicioso del menú!
                  </p>
                  <button
                    onClick={closeCart}
                    className="bg-red-500 text-white px-6 py-2 rounded-xl font-semibold text-sm hover:bg-red-600 transition-colors"
                  >
                    Ver Menú
                  </button>
                </div>
              ) : (
                <ul className="space-y-3">
                  <AnimatePresence>
                    {items.map((item) => (
                      <motion.li
                        key={item.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-gray-50 rounded-xl p-3 flex gap-3"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm leading-tight">
                            {item.name}
                          </p>
                          <p className="text-red-500 font-bold text-sm mt-0.5">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                          {item.notes && (
                            <p className="text-gray-400 text-xs mt-1 italic">
                              {item.notes}
                            </p>
                          )}
                        </div>

                        {/* Quantity controls */}
                        <div className="flex flex-col items-end gap-2">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-0.5">
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded-md transition-colors"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-sm font-bold w-5 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded-md transition-colors"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {/* Footer with total and checkout */}
            {items.length > 0 && (
              <div className="border-t border-gray-100 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">Subtotal</span>
                  <span className="font-bold text-gray-900 text-lg">
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Impuestos calculados al finalizar la compra
                </p>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="block w-full bg-red-500 hover:bg-red-600 text-white text-center py-3.5 rounded-xl font-bold text-base transition-colors shadow-lg shadow-red-200"
                >
                  Proceder al Pago →
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
