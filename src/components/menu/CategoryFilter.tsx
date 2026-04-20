"use client";

import { motion } from "framer-motion";

const categories = [
  { id: "all", label: "Todo", emoji: "🍽️" },
  { id: "tortas", label: "Tortas", emoji: "🥪" },
  { id: "tacos", label: "Tacos", emoji: "🌮" },
  { id: "hamburguesas", label: "Hamburguesas", emoji: "🍔" },
  { id: "burritos", label: "Burritos", emoji: "🌯" },
];

interface CategoryFilterProps {
  selected: string;
  onChange: (cat: string) => void;
  counts: Record<string, number>;
}

export function CategoryFilter({ selected, onChange, counts }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => {
        const isActive = selected === cat.id;
        const count = cat.id === "all"
          ? Object.values(counts).reduce((a, b) => a + b, 0)
          : counts[cat.id] ?? 0;

        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              isActive
                ? "bg-red-500 text-white shadow-md shadow-red-200"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                isActive ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500"
              }`}
            >
              {count}
            </span>
            {isActive && (
              <motion.div
                layoutId="activeCategory"
                className="absolute inset-0 bg-red-500 rounded-xl -z-10"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
