"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { MenuItem } from "@/types";
import { menuItems as staticMenu } from "@/lib/menu-data";
import { MenuCard } from "@/components/menu/MenuCard";
import { CategoryFilter } from "@/components/menu/CategoryFilter";
import { Search } from "lucide-react";

function MenuContent() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<MenuItem[]>(staticMenu);
  const [selectedCat, setSelectedCat] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const cat = searchParams.get("cat");
    if (cat) setSelectedCat(cat);
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/menu-items")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data) && data.length > 0) setItems(data); })
      .catch(() => {});
  }, []);

  const available = items.filter((i) => i.available);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    available.forEach((item) => { c[item.category] = (c[item.category] ?? 0) + 1; });
    return c;
  }, [available]);

  const filtered = useMemo(() => {
    return available.filter((item) => {
      const matchesCat = selectedCat === "all" || item.category === selectedCat;
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [available, selectedCat, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900 mb-2">Nuestro Menú 🍽️</h1>
        <p className="text-gray-500 text-lg">Todo hecho con ingredientes frescos y mucho sabor</p>
      </div>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar en el menú..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 transition-colors"
        />
      </div>

      <div className="mb-8">
        <CategoryFilter selected={selectedCat} onChange={setSelectedCat} counts={counts} />
      </div>

      <p className="text-gray-400 text-sm mb-6">
        {filtered.length} {filtered.length === 1 ? "platillo" : "platillos"} encontrado{filtered.length !== 1 ? "s" : ""}
      </p>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((item, i) => <MenuCard key={item.id} item={item} index={i} />)}
        </div>
      ) : (
        <div className="text-center py-20">
          <span className="text-6xl block mb-4">🔍</span>
          <p className="text-gray-500 font-medium text-lg">No encontramos resultados</p>
          <p className="text-gray-400 text-sm mt-2">Intenta con otra búsqueda o categoría</p>
        </div>
      )}
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">Cargando menú...</div>}>
      <MenuContent />
    </Suspense>
  );
}
