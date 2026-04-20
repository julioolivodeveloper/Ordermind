"use client";

import Link from "next/link";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useState } from "react";

export function Navbar() {
  const { itemCount, toggleCart } = useCartStore();
  const count = itemCount();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🌮</span>
            <div className="leading-tight">
              <p className="font-bold text-gray-900 text-sm sm:text-base leading-none">
                Acá Las Tortas
              </p>
              <p className="text-xs text-red-500 font-medium">El Paso, TX</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/menu"
              className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
            >
              Menú
            </Link>
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
            >
              Dashboard
            </Link>
          </nav>

          {/* Cart button */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleCart}
              className="relative flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full font-medium text-sm transition-colors"
            >
              <ShoppingCart size={16} />
              <span className="hidden sm:inline">Carrito</span>
              {count > 0 && (
                <span className="cart-badge absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 text-gray-600"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 animate-slide-in-up">
            <nav className="flex flex-col gap-3">
              <Link
                href="/menu"
                className="text-gray-700 font-medium px-2 py-1"
                onClick={() => setMobileOpen(false)}
              >
                🍽️ Menú
              </Link>
              <Link
                href="/dashboard"
                className="text-gray-700 font-medium px-2 py-1"
                onClick={() => setMobileOpen(false)}
              >
                📊 Dashboard
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
