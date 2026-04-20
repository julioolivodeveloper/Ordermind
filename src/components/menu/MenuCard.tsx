"use client";

import { motion } from "framer-motion";
import { Plus, Flame, Star } from "lucide-react";
import { MenuItem } from "@/types";
import { useCartStore } from "@/store/cart-store";
import toast from "react-hot-toast";

interface MenuCardProps {
  item: MenuItem;
  index?: number;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  tortas: "🥪",
  tacos: "🌮",
  hamburguesas: "🍔",
  burritos: "🌯",
};

const PLACEHOLDER_COLORS: Record<string, string> = {
  tortas: "from-amber-400 to-orange-500",
  tacos: "from-yellow-400 to-amber-500",
  hamburguesas: "from-red-400 to-rose-500",
  burritos: "from-green-400 to-emerald-500",
};

export function MenuCard({ item, index = 0 }: MenuCardProps) {
  const { addItem, openCart } = useCartStore();

  const handleAdd = () => {
    addItem(item);
    toast.success(`${item.name} agregado al carrito!`, { duration: 2000 });
    openCart();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="menu-card bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col"
    >
      {/* Image placeholder */}
      <div
        className={`relative h-44 bg-gradient-to-br ${PLACEHOLDER_COLORS[item.category]} flex items-center justify-center`}
      >
        <span className="text-7xl drop-shadow-md">
          {CATEGORY_EMOJIS[item.category]}
        </span>
        {item.popular && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
            <Star size={10} className="fill-yellow-900" />
            Popular
          </div>
        )}
        {item.spicy && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            <Flame size={10} />
            Picante
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-base leading-tight mb-1">
          {item.name}
        </h3>
        <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-4">
          {item.description}
        </p>

        <div className="flex items-center justify-between mt-auto">
          <span className="text-xl font-black text-gray-900">
            ${item.price.toFixed(2)}
          </span>
          <button
            onClick={handleAdd}
            disabled={!item.available}
            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors active:scale-95"
          >
            <Plus size={16} />
            Agregar
          </button>
        </div>
      </div>
    </motion.div>
  );
}
