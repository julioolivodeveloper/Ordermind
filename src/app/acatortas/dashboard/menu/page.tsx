'use client'
import { useEffect, useState } from 'react'
import { Plus, Pencil, Check, X, ToggleLeft, ToggleRight } from 'lucide-react'
import { useAcaTortasStore } from '@/store/acatortas-store'
import { CATEGORIES, DEFAULT_MENU, type MenuItem } from '@/data/acatortas-menu'

type EditState = Partial<MenuItem> & { id: string }

export default function MenuEditorPage() {
  const { menu, setMenu, updateMenuItem } = useAcaTortasStore()
  const [filterCat, setFilterCat] = useState('Todos')
  const [editing, setEditing] = useState<EditState | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({ category: CATEGORIES[0], available: true })
  const [saving, setSaving] = useState<string | null>(null)

  // Cargar overrides desde Supabase al montar
  useEffect(() => {
    fetch('/api/acatortas/menu')
      .then((r) => r.json())
      .then((overrides: { item_id: string; available: boolean; price?: number }[]) => {
        const updated = DEFAULT_MENU.map((item) => {
          const ov = overrides.find((o) => o.item_id === item.id)
          if (!ov) return item
          return { ...item, available: ov.available, price: ov.price ?? item.price }
        })
        setMenu(updated)
      })
      .catch(() => {})
  }, [setMenu])

  const toggleAvail = async (item: MenuItem) => {
    setSaving(item.id)
    const newAvail = !item.available
    updateMenuItem(item.id, { available: newAvail })
    try {
      await fetch('/api/acatortas/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: item.id, available: newAvail, price: item.price }),
      })
    } catch {}
    setSaving(null)
  }

  const saveEdit = async () => {
    if (!editing) return
    const { id, ...updates } = editing
    updateMenuItem(id, updates)
    setSaving(id)
    try {
      await fetch('/api/acatortas/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: id, available: updates.available ?? true, price: updates.price }),
      })
    } catch {}
    setSaving(null)
    setEditing(null)
  }

  const handleAdd = async () => {
    if (!newItem.name?.trim() || !newItem.price) return
    const item: MenuItem = {
      id: `custom-${Date.now()}`,
      name: newItem.name!,
      description: newItem.description || '',
      price: Number(newItem.price),
      category: newItem.category || CATEGORIES[0],
      available: newItem.available ?? true,
    }
    setMenu([...menu, item])
    // Custom items save full override
    await fetch('/api/acatortas/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: item.id, available: item.available, price: item.price }),
    }).catch(() => {})
    setNewItem({ category: CATEGORIES[0], available: true })
    setShowAdd(false)
  }

  const visible = filterCat === 'Todos' ? menu : menu.filter((m) => m.category === filterCat)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white font-black text-2xl">Gestión del Menú</h1>
          <p className="text-gray-400 text-sm mt-0.5">{menu.length} platillos — cambios sincronizan en tiempo real</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-black text-white text-sm"
          style={{ backgroundColor: '#CC0000' }}
        >
          <Plus className="w-4 h-4" /> Agregar
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
        {['Todos', ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition"
            style={filterCat === cat ? { backgroundColor: '#CC0000', color: 'white' } : { backgroundColor: '#1F2937', color: '#9CA3AF' }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 mb-6">
          <h3 className="text-white font-black text-sm mb-4">Nuevo Platillo</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <input
              placeholder="Nombre *"
              value={newItem.name || ''}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              className="bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]"
            />
            <input
              placeholder="Precio *"
              type="number"
              step="0.01"
              value={newItem.price || ''}
              onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
              className="bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]"
            />
            <select
              value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              className="bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="avail-new" checked={newItem.available ?? true}
                onChange={(e) => setNewItem({ ...newItem, available: e.target.checked })}
                className="w-4 h-4 accent-red-600"
              />
              <label htmlFor="avail-new" className="text-gray-300 text-sm font-semibold">Disponible</label>
            </div>
          </div>
          <textarea
            placeholder="Descripción"
            value={newItem.description || ''}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            rows={2}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none resize-none mb-3"
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-white text-sm" style={{ backgroundColor: '#16A34A' }}>
              <Check className="w-4 h-4" /> Guardar
            </button>
            <button onClick={() => setShowAdd(false)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-gray-400 border border-gray-700 text-sm hover:bg-gray-800 transition">
              <X className="w-4 h-4" /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Menu list */}
      <div className="space-y-2">
        {visible.map((item) => (
          <div key={item.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            {editing?.id === item.id ? (
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <input
                    value={editing.name || ''}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    className="bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none"
                    placeholder="Nombre"
                  />
                  <input
                    type="number" step="0.01"
                    value={editing.price || ''}
                    onChange={(e) => setEditing({ ...editing, price: parseFloat(e.target.value) })}
                    className="bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none"
                    placeholder="Precio"
                  />
                  <select
                    value={editing.category || ''}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                    className="bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id={`avail-${item.id}`} checked={editing.available ?? true}
                      onChange={(e) => setEditing({ ...editing, available: e.target.checked })}
                      className="w-4 h-4 accent-red-600"
                    />
                    <label htmlFor={`avail-${item.id}`} className="text-gray-300 text-sm font-semibold">Disponible</label>
                  </div>
                </div>
                <textarea
                  value={editing.description || ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none resize-none mb-3"
                  placeholder="Descripción"
                />
                <div className="flex gap-2">
                  <button onClick={saveEdit} disabled={saving === item.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-white text-sm disabled:opacity-60" style={{ backgroundColor: '#16A34A' }}>
                    <Check className="w-4 h-4" /> {saving === item.id ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button onClick={() => setEditing(null)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-gray-400 border border-gray-700 text-sm hover:bg-gray-800 transition">
                    <X className="w-4 h-4" /> Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-black text-sm ${item.available ? 'text-white' : 'text-gray-500 line-through'}`}>{item.name}</p>
                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{item.category}</span>
                    {!item.available && <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full font-bold">No disponible</span>}
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5 truncate">{item.description}</p>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  <p className="text-white font-black text-base">${item.price.toFixed(2)}</p>
                  <button
                    onClick={() => toggleAvail(item)}
                    disabled={saving === item.id}
                    className="transition disabled:opacity-40"
                    title={item.available ? 'Desactivar' : 'Activar'}
                  >
                    {item.available
                      ? <ToggleRight className="w-6 h-6 text-green-500" />
                      : <ToggleLeft className="w-6 h-6 text-gray-600" />
                    }
                  </button>
                  <button
                    onClick={() => setEditing({ ...item })}
                    className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
