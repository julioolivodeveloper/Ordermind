"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { MenuItem, MenuCategory, MenuItemInput } from "@/types";
import { Plus, Pencil, Trash2, X, Check, Flame, Star, Eye, EyeOff, Upload, Link, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

const CATEGORIES: { value: MenuCategory; label: string; emoji: string }[] = [
  { value: "tortas", label: "Tortas", emoji: "🥪" },
  { value: "tacos", label: "Tacos", emoji: "🌮" },
  { value: "hamburguesas", label: "Hamburguesas", emoji: "🍔" },
  { value: "burritos", label: "Burritos", emoji: "🌯" },
];

const CAT_COLORS: Record<MenuCategory, string> = {
  tortas: "from-amber-400 to-orange-500",
  tacos: "from-yellow-400 to-amber-500",
  hamburguesas: "from-red-400 to-rose-500",
  burritos: "from-green-400 to-emerald-500",
};

const CAT_EMOJIS: Record<MenuCategory, string> = {
  tortas: "🥪", tacos: "🌮", hamburguesas: "🍔", burritos: "🌯",
};

const EMPTY_FORM: MenuItemInput = {
  name: "", description: "", price: 0, category: "tortas",
  image: "", available: true, popular: false, spicy: false,
};

type ImageTab = "upload" | "url";

export function MenuManager() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState<MenuCategory | "all">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<MenuItemInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [imageTab, setImageTab] = useState<ImageTab>("upload");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchItems = async () => {
    setLoading(true);
    const res = await fetch("/api/menu-items");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const filtered = filterCat === "all" ? items : items.filter((i) => i.category === filterCat);

  // ── Image upload to Supabase Storage ────────────────────────────────────
  const uploadImage = useCallback(async (file: File) => {
    const MAX_MB = 5;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`La imagen debe pesar menos de ${MAX_MB}MB`);
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("menu-images")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
      setForm((f) => ({ ...f, image: data.publicUrl }));
      toast.success("Imagen subida ✓");
    } catch (err) {
      console.error(err);
      toast.error("Error al subir la imagen. Verifica el bucket en Supabase.");
    } finally {
      setUploading(false);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadImage(file);
  }, [uploadImage]);

  // ── Save ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }
    if (!form.price || form.price <= 0) { toast.error("El precio debe ser mayor a $0"); return; }

    setSaving(true);
    try {
      const method = editingId ? "PATCH" : "POST";
      const body = editingId ? { id: editingId, ...form } : form;
      const res = await fetch("/api/menu-items", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const result = await res.json();

      if (editingId) {
        setItems((prev) => prev.map((i) => (i.id === editingId ? result : i)));
        toast.success("Platillo actualizado ✓");
      } else {
        setItems((prev) => [...prev, result]);
        toast.success("Platillo agregado ✓");
      }
      closeForm();
    } catch {
      toast.error("Error al guardar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle available ─────────────────────────────────────────────────────
  const toggleAvailable = async (item: MenuItem) => {
    const next = !item.available;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, available: next } : i)));
    await fetch("/api/menu-items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, available: next }),
    });
    toast.success(next ? "Platillo activado" : "Platillo desactivado");
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const res = await fetch("/api/menu-items", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Platillo eliminado");
    } else {
      toast.error("Error al eliminar");
    }
    setDeletingId(null);
  };

  const openEdit = (item: MenuItem) => {
    setForm({ name: item.name, description: item.description, price: item.price,
      category: item.category, image: item.image, available: item.available,
      popular: item.popular, spicy: item.spicy });
    setEditingId(item.id);
    setImageTab(item.image ? "upload" : "upload");
    setShowForm(true);
  };

  const openNew = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setImageTab("upload");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const set = <K extends keyof MenuItemInput>(key: K, val: MenuItemInput[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {[{ value: "all" as const, label: "Todos", emoji: "🍽️" }, ...CATEGORIES].map((cat) => (
            <button
              key={cat.value}
              onClick={() => setFilterCat(cat.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                filterCat === cat.value
                  ? "bg-red-500 text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <span>{cat.emoji}</span> {cat.label}
              <span className={`text-xs px-1 rounded-full ${filterCat === cat.value ? "bg-white/25 text-white" : "bg-gray-100 text-gray-400"}`}>
                {cat.value === "all" ? items.length : items.filter((i) => i.category === cat.value).length}
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-md shadow-red-200"
        >
          <Plus size={16} /> Nuevo platillo
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-48 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-5xl block mb-3">🍽️</span>
          <p className="text-gray-500 font-medium">No hay platillos en esta categoría</p>
          <button onClick={openNew} className="mt-4 text-red-500 font-semibold text-sm">+ Agregar el primero</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filtered.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${
                  item.available ? "border-gray-100" : "border-dashed border-gray-300 opacity-60"
                }`}
              >
                <div className={`relative h-32 bg-gradient-to-br ${CAT_COLORS[item.category]} flex items-center justify-center overflow-hidden`}>
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl drop-shadow">{CAT_EMOJIS[item.category]}</span>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1">
                    {item.popular && (
                      <span className="flex items-center gap-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold px-1.5 py-0.5 rounded-full">
                        <Star size={9} className="fill-yellow-900" /> Popular
                      </span>
                    )}
                    {item.spicy && (
                      <span className="flex items-center gap-0.5 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                        <Flame size={9} /> Picante
                      </span>
                    )}
                  </div>
                  {!item.available && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded-lg">No disponible</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <p className="font-bold text-gray-900 text-sm leading-tight line-clamp-1">{item.name}</p>
                    <span className="font-black text-gray-900 text-sm shrink-0">${item.price.toFixed(2)}</span>
                  </div>
                  <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed mb-3">{item.description}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleAvailable(item)}
                      className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-1 justify-center ${
                        item.available ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {item.available ? <Eye size={12} /> : <EyeOff size={12} />}
                      {item.available ? "Activo" : "Inactivo"}
                    </button>
                    <button onClick={() => openEdit(item)} className="flex items-center justify-center w-8 h-8 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="flex items-center justify-center w-8 h-8 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Modal form ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeForm}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-x-4 top-[3%] bottom-[3%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg z-50 overflow-y-auto"
            >
              <div className="bg-white rounded-3xl shadow-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black text-gray-900">
                    {editingId ? "✏️ Editar platillo" : "➕ Nuevo platillo"}
                  </h2>
                  <button onClick={closeForm} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                    <X size={18} className="text-gray-500" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre *</label>
                    <input
                      type="text" value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="Ej: Torta de Milanesa"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 text-gray-900 placeholder-gray-400"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Descripción</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => set("description", e.target.value)}
                      placeholder="Ingredientes y descripción..."
                      rows={2}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 text-gray-900 placeholder-gray-400 resize-none"
                    />
                  </div>

                  {/* Price + Category */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Precio (USD) *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                        <input
                          type="number" step="0.01" min="0"
                          value={form.price || ""}
                          onChange={(e) => set("price", parseFloat(e.target.value) || 0)}
                          placeholder="12.99"
                          className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 text-gray-900"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Categoría *</label>
                      <select
                        value={form.category}
                        onChange={(e) => set("category", e.target.value as MenuCategory)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 text-gray-900 bg-white"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Image section */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Imagen</label>

                    {/* Tabs */}
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-3 w-fit">
                      <button
                        type="button"
                        onClick={() => setImageTab("upload")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          imageTab === "upload" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                        }`}
                      >
                        <Upload size={12} /> Subir archivo
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageTab("url")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          imageTab === "url" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                        }`}
                      >
                        <Link size={12} /> Pegar URL
                      </button>
                    </div>

                    {imageTab === "upload" ? (
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => !uploading && fileInputRef.current?.click()}
                        className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer ${
                          dragOver ? "border-red-400 bg-red-50" : "border-gray-300 hover:border-red-300 hover:bg-red-50/30"
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />

                        {form.image ? (
                          /* Preview with replace option */
                          <div className="relative h-36 rounded-xl overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={form.image} alt="preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <span className="text-white text-sm font-semibold">Cambiar imagen</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); set("image", ""); }}
                              className="absolute top-2 right-2 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors"
                            >
                              <X size={12} className="text-white" />
                            </button>
                          </div>
                        ) : uploading ? (
                          <div className="h-36 flex flex-col items-center justify-center gap-2">
                            <Loader2 size={28} className="text-red-400 animate-spin" />
                            <p className="text-sm text-gray-500 font-medium">Subiendo imagen...</p>
                          </div>
                        ) : (
                          <div className="h-36 flex flex-col items-center justify-center gap-2 px-4 text-center">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                              <Upload size={18} className="text-red-400" />
                            </div>
                            <p className="text-sm font-semibold text-gray-600">
                              Arrastra una imagen aquí
                            </p>
                            <p className="text-xs text-gray-400">o haz clic para seleccionar — JPG, PNG, WEBP (máx 5MB)</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <input
                          type="url"
                          value={form.image}
                          onChange={(e) => set("image", e.target.value)}
                          placeholder="https://ejemplo.com/imagen.jpg"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 text-gray-900 placeholder-gray-400"
                        />
                        {form.image && (
                          <div className="mt-2 h-28 rounded-xl overflow-hidden border border-gray-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={form.image} alt="preview"
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Toggles */}
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { key: "available", label: "Disponible", icon: "✅" },
                      { key: "popular", label: "Popular", icon: "⭐" },
                      { key: "spicy", label: "Picante", icon: "🌶️" },
                    ] as const).map(({ key, label, icon }) => (
                      <button
                        key={key} type="button"
                        onClick={() => set(key, !form[key])}
                        className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                          form[key] ? "border-red-400 bg-red-50 text-red-700" : "border-gray-200 bg-gray-50 text-gray-400"
                        }`}
                      >
                        <span className="text-xl">{icon}</span>
                        <span className="text-xs">{label}</span>
                        {form[key] ? <Check size={12} className="text-red-500" /> : <X size={12} className="text-gray-300" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={closeForm}
                    className="flex-1 py-3 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || uploading}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Agregar platillo"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
