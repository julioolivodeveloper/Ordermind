import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { menuItems } from "@/lib/menu-data";
import { MenuCard } from "./MenuCard";

export function FeaturedMenu() {
  const featured = menuItems.filter((item) => item.popular).slice(0, 6);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-red-500 font-semibold text-sm uppercase tracking-wider mb-2">
            Nuestros favoritos
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900">
            Lo Más Popular ⭐
          </h2>
        </div>
        <Link
          href="/menu"
          className="hidden sm:flex items-center gap-2 text-red-500 hover:text-red-600 font-semibold text-sm transition-colors"
        >
          Ver todo el menú
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {featured.map((item, i) => (
          <MenuCard key={item.id} item={item} index={i} />
        ))}
      </div>

      <div className="mt-8 text-center sm:hidden">
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 text-red-500 font-semibold"
        >
          Ver todo el menú <ArrowRight size={16} />
        </Link>
      </div>

      {/* Categories grid */}
      <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tortas", emoji: "🥪", color: "from-amber-400 to-orange-500", href: "/menu?cat=tortas" },
          { label: "Tacos", emoji: "🌮", color: "from-yellow-400 to-amber-500", href: "/menu?cat=tacos" },
          { label: "Hamburguesas", emoji: "🍔", color: "from-red-400 to-rose-500", href: "/menu?cat=hamburguesas" },
          { label: "Burritos", emoji: "🌯", color: "from-green-400 to-emerald-500", href: "/menu?cat=burritos" },
        ].map((cat) => (
          <Link
            key={cat.label}
            href={cat.href}
            className={`bg-gradient-to-br ${cat.color} text-white rounded-2xl p-6 text-center hover:scale-105 transition-transform shadow-md`}
          >
            <div className="text-4xl mb-2">{cat.emoji}</div>
            <div className="font-bold text-lg">{cat.label}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
