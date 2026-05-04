'use client'
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { MenuCategory, MenuItem, ItemIngredient } from '@/types'
import { Box } from 'lucide-react'

interface Props {
  restaurantId: string
  initialCategories: MenuCategory[]
  initialItems: MenuItem[]
}

const BLANK_ITEM = {
  name: '', description: '', price: '', image_url: '',
  is_available: true, is_popular: false, is_spicy: false,
  category_id: '', sort_order: 0,
  discount_percent: '', name_en: '', description_en: '',
  model_url: '', model_usdz_url: '', model_scale_cm: '18',
}

export function MenuManager({ restaurantId, initialCategories, initialItems }: Props) {
  const { toast } = useToast()
  const [categories, setCategories] = useState(initialCategories)
  const [items, setItems] = useState(initialItems)
  const [selectedCat, setSelectedCat] = useState<string>('all')
  const [itemModal, setItemModal] = useState(false)
  const [catModal, setCatModal] = useState(false)
  const [ingredientModal, setIngredientModal] = useState<MenuItem | null>(null)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [itemForm, setItemForm] = useState(BLANK_ITEM)
  const [catForm, setCatForm] = useState({ name: '', icon: '🍽️' })
  const [ingForm, setIngForm] = useState({ name: '', is_default: true, extra_cost: 0 })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingModel, setUploadingModel] = useState(false)
  const [modelUrlNeedsRescale, setModelUrlNeedsRescale] = useState(false)

  async function handleImageUpload(file: File) {
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `${restaurantId}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('menu-images').upload(path, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('menu-images').getPublicUrl(path)
      setItemForm(f => ({ ...f, image_url: data.publicUrl }))
    } catch {
      toast('Error al subir imagen', 'error')
    } finally {
      setUploading(false)
    }
  }

  async function handleModelUpload(file: File) {
    setUploadingModel(true)
    try {
      // Step 1: upload raw GLB directly to Supabase (no Vercel size limit)
      const supabase = createClient()
      const path = `${restaurantId}/${Date.now()}.glb`
      const { error: uploadError } = await supabase.storage
        .from('models')
        .upload(path, file, { upsert: true, contentType: 'model/gltf-binary' })
      if (uploadError) throw new Error(uploadError.message)
      const { data: urlData } = supabase.storage.from('models').getPublicUrl(path)

      // Step 2: ask the server to rescale it in place (server downloads → processes → re-uploads)
      const processRes = await fetch('/api/process-glb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlData.publicUrl, path, targetCm: parseInt(itemForm.model_scale_cm) || 18 }),
      })
      const processData = await processRes.json()
      if (!processRes.ok) {
        // Rescaling failed but the original is already uploaded — use it as-is
        console.warn('[3D] rescaling failed:', processData.error)
        setItemForm(f => ({ ...f, model_url: urlData.publicUrl }))
        toast('Modelo subido (sin reescalar)')
        return
      }

      setItemForm(f => ({ ...f, model_url: processData.url }))
      toast('Modelo 3D subido y reescalado')
    } catch (err: any) {
      toast(err.message ?? 'Error al subir modelo 3D', 'error')
    } finally {
      setUploadingModel(false)
    }
  }

  const filteredItems = selectedCat === 'all' ? items : items.filter(i => i.category_id === selectedCat)

  function openNewItem() {
    setEditingItem(null)
    setModelUrlNeedsRescale(false)
    setItemForm(BLANK_ITEM)
    setItemModal(true)
  }

  function openEditItem(item: MenuItem) {
    setEditingItem(item)
    setModelUrlNeedsRescale(false)
    setItemForm({
      name: item.name, description: item.description ?? '',
      price: String(item.price), image_url: item.image_url ?? '',
      is_available: item.is_available, is_popular: item.is_popular,
      is_spicy: item.is_spicy, category_id: item.category_id ?? '',
      sort_order: item.sort_order,
      discount_percent: item.discount_percent ? String(item.discount_percent) : '',
      name_en: item.name_en ?? '', description_en: item.description_en ?? '',
      model_url: item.model_url ?? '', model_usdz_url: item.model_usdz_url ?? '',
      model_scale_cm: String(item.model_scale_cm ?? 18),
    })
    setItemModal(true)
  }

  async function handleSaveItem() {
    if (!itemForm.name || !itemForm.price) return
    setSaving(true)
    try {
      // Rescale GLB if user pasted a URL manually
      let model_url = itemForm.model_url
      if (modelUrlNeedsRescale && model_url && (model_url.endsWith('.glb') || model_url.includes('.glb?'))) {
        setUploadingModel(true)
        try {
          const res = await fetch('/api/process-glb', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: model_url, path: `${restaurantId}/${Date.now()}.glb`, targetCm: parseInt(itemForm.model_scale_cm) || 18 }),
          })
          const data = await res.json()
          if (res.ok) {
            model_url = data.url
            setItemForm(f => ({ ...f, model_url: data.url }))
          }
        } catch { /* use URL as-is */ } finally {
          setUploadingModel(false)
          setModelUrlNeedsRescale(false)
        }
      }

      const body = {
        ...itemForm,
        model_url,
        price: parseFloat(itemForm.price),
        discount_percent: itemForm.discount_percent ? parseFloat(itemForm.discount_percent) : 0,
        model_scale_cm: parseInt(itemForm.model_scale_cm) || 18,
        restaurant_id: restaurantId,
      }
      if (editingItem) {
        const res = await fetch(`/api/dashboard/menu/items/${editingItem.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        })
        const updated = await res.json()
        if (!res.ok) throw new Error(updated.error ?? 'Error al actualizar')
        setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...updated } : i))
        toast('Item updated')
      } else {
        const res = await fetch('/api/dashboard/menu/items', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        })
        const created = await res.json()
        if (!res.ok) throw new Error(created.error ?? 'Error al crear')
        setItems(prev => [...prev, created])
        toast('Item created')
      }
      setItemModal(false)
    } catch {
      toast('Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteItem(item: MenuItem) {
    if (!confirm(`¿Eliminar "${item.name}"?`)) return
    await fetch(`/api/dashboard/menu/items/${item.id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== item.id))
    toast('Platillo eliminado')
  }

  async function handleToggleAvailable(item: MenuItem) {
    await fetch(`/api/dashboard/menu/items/${item.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_available: !item.is_available }),
    })
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: !i.is_available } : i))
  }

  async function handleSaveCategory() {
    if (!catForm.name) return
    setSaving(true)
    try {
      const slug = catForm.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      const res = await fetch('/api/dashboard/menu/categories', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...catForm, slug, restaurant_id: restaurantId }),
      })
      const created = await res.json()
      setCategories(prev => [...prev, created])
      setCatForm({ name: '', icon: '🍽️' })
      setCatModal(false)
      toast('Categoría creada')
    } catch {
      toast('Error al crear categoría', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddIngredient() {
    if (!ingredientModal || !ingForm.name) return
    setSaving(true)
    try {
      const res = await fetch('/api/dashboard/menu/ingredients', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ingForm, menu_item_id: ingredientModal.id }),
      })
      const created = await res.json()
      setItems(prev => prev.map(i =>
        i.id === ingredientModal.id
          ? { ...i, ingredients: [...(i.ingredients ?? []), created] }
          : i
      ))
      setIngredientModal(prev => prev ? { ...prev, ingredients: [...(prev.ingredients ?? []), created] } : null)
      setIngForm({ name: '', is_default: true, extra_cost: 0 })
      toast('Ingrediente agregado')
    } catch {
      toast('Error', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteIngredient(item: MenuItem, ing: ItemIngredient) {
    await fetch(`/api/dashboard/menu/ingredients/${ing.id}`, { method: 'DELETE' })
    const updated = (item.ingredients ?? []).filter(i => i.id !== ing.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, ingredients: updated } : i))
    setIngredientModal(prev => prev ? { ...prev, ingredients: updated } : null)
  }

  return (
    <div>
      {/* Actions */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => setCatModal(true)} className="border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          + Categoría
        </button>
        <button onClick={openNewItem} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          + Nuevo Platillo
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button
          onClick={() => setSelectedCat('all')}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${selectedCat === 'all' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300'}`}
        >
          Todos ({items.length})
        </button>
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCat(c.id)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${selectedCat === c.id ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300'}`}
          >
            {c.icon} {c.name} ({items.filter(i => i.category_id === c.id).length})
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredItems.map(item => (
          <div key={item.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${item.is_available ? 'border-slate-100' : 'border-slate-100 opacity-60'}`}>
            {item.image_url && (
              <div className="h-40 overflow-hidden">
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">{item.name}</h3>
                  {item.name_en && <p className="text-xs text-slate-400 mt-0.5 italic">{item.name_en}</p>}
                  {(item.category as any)?.name && (
                    <p className="text-xs text-slate-400 mt-0.5">{(item.category as any).name}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {(item.discount_percent ?? 0) > 0 ? (
                    <>
                      <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold mb-0.5 block">-{item.discount_percent}%</span>
                      <span className="text-xs text-slate-400 line-through block">{formatCurrency(item.price)}</span>
                      <span className="text-indigo-600 font-bold text-sm">{formatCurrency(item.price * (1 - (item.discount_percent ?? 0) / 100))}</span>
                    </>
                  ) : (
                    <span className="text-indigo-600 font-bold text-sm">{formatCurrency(item.price)}</span>
                  )}
                </div>
              </div>
              {item.description && (
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{item.description}</p>
              )}
              <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                {item.is_popular && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">⭐ Popular</span>}
                {item.is_spicy && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">🌶️ Picante</span>}
                {(item.ingredients?.length ?? 0) > 0 && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    {item.ingredients!.length} ing.
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleToggleAvailable(item)} className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors border ${item.is_available ? 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100' : 'border-slate-200 text-slate-500 bg-slate-50 hover:bg-slate-100'}`}>
                  {item.is_available ? 'Disponible' : 'No disp.'}
                </button>
                <button onClick={() => setIngredientModal(item)} className="border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs px-2 py-1.5 rounded-lg transition-colors">
                  Ing.
                </button>
                <button onClick={() => openEditItem(item)} className="border border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-xs px-2 py-1.5 rounded-lg transition-colors">
                  Editar
                </button>
                <button onClick={() => handleDeleteItem(item)} className="text-red-400 hover:text-red-600 hover:bg-red-50 text-xs px-2 py-1.5 rounded-lg transition-colors">
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredItems.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="font-medium">No hay platillos en esta categoría</p>
            <button onClick={openNewItem} className="mt-3 text-indigo-600 text-sm font-medium hover:underline">Agregar el primero</button>
          </div>
        )}
      </div>

      {/* Item Modal */}
      <Modal open={itemModal} onClose={() => setItemModal(false)} title={editingItem ? 'Editar Platillo' : 'Nuevo Platillo'} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
            <input value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} placeholder="Torta de milanesa" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
            <textarea value={itemForm.description} onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Con frijoles, aguacate, tomate..." className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Precio ($) *</label>
              <input type="number" value={itemForm.price} onChange={e => setItemForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" step="0.01" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descuento (%)</label>
              <input type="number" value={itemForm.discount_percent} onChange={e => setItemForm(f => ({ ...f, discount_percent: e.target.value }))} placeholder="0" min="0" max="99" step="1" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
            <select value={itemForm.category_id} onChange={e => setItemForm(f => ({ ...f, category_id: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Sin categoría</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Traducción al inglés (opcional)</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre en inglés</label>
                <input value={itemForm.name_en} onChange={e => setItemForm(f => ({ ...f, name_en: e.target.value }))} placeholder="Chicken taco" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción en inglés</label>
                <textarea value={itemForm.description_en} onChange={e => setItemForm(f => ({ ...f, description_en: e.target.value }))} rows={2} placeholder="With beans, avocado, tomato..." className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Imagen del platillo</label>
            {itemForm.image_url && (
              <div className="relative mb-2">
                <img src={itemForm.image_url} alt="" className="w-full h-36 object-cover rounded-xl border border-slate-200" />
                <button
                  type="button"
                  onClick={() => setItemForm(f => ({ ...f, image_url: '' }))}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                >✕</button>
              </div>
            )}
            <label className={`flex items-center justify-center gap-2 w-full border-2 border-dashed rounded-xl px-4 py-3 text-sm cursor-pointer transition-colors ${uploading ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}>
              <span>{uploading ? 'Subiendo...' : '📷 Seleccionar imagen'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f) }}
              />
            </label>
          </div>
          <div className="border-t border-slate-100 pt-3">
            <div className="flex items-center gap-2 mb-3">
              <Box className="w-4 h-4 text-slate-400" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">3D Model (optional)</p>
            </div>
            <div className="space-y-3">
              {/* Real-world size */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tamaño real del platillo <span className="text-slate-400 font-normal">(centímetros — ancho o largo máximo)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={itemForm.model_scale_cm}
                    onChange={e => setItemForm(f => ({ ...f, model_scale_cm: e.target.value }))}
                    className="w-24 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-slate-400 text-sm">cm</span>
                  <span className="text-slate-400 text-xs">(ej: hamburguesa = 12, pizza = 30, taco = 15)</span>
                </div>
              </div>

              {/* GLB upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Modelo GLB <span className="text-slate-400 font-normal">(se reescala al tamaño indicado arriba)</span>
                </label>
                {itemForm.model_url ? (
                  <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
                    <Box className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span className="text-xs text-indigo-700 truncate flex-1">{itemForm.model_url.split('/').pop()}</span>
                    <button
                      type="button"
                      onClick={() => setItemForm(f => ({ ...f, model_url: '' }))}
                      className="text-indigo-400 hover:text-red-500 text-xs shrink-0 transition-colors"
                    >✕</button>
                  </div>
                ) : (
                  <label className={`flex items-center justify-center gap-2 w-full border-2 border-dashed rounded-xl px-4 py-3 text-sm cursor-pointer transition-colors ${uploadingModel ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}>
                    <span>{uploadingModel ? 'Procesando y subiendo…' : '📦 Seleccionar archivo .glb'}</span>
                    <input
                      type="file"
                      accept=".glb"
                      className="hidden"
                      disabled={uploadingModel}
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleModelUpload(f) }}
                    />
                  </label>
                )}
                {/* Fallback: paste URL manually — rescaled automatically on save */}
                <input
                  value={itemForm.model_url}
                  onChange={e => {
                    setItemForm(f => ({ ...f, model_url: e.target.value }))
                    setModelUrlNeedsRescale(true)
                  }}
                  placeholder="O pega una URL .glb directamente"
                  className="mt-2 w-full border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-500 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  USDZ URL <span className="text-slate-400 font-normal">(iPhone AR nativo — opcional)</span>
                </label>
                <input
                  value={itemForm.model_usdz_url}
                  onChange={e => setItemForm(f => ({ ...f, model_usdz_url: e.target.value }))}
                  placeholder="https://…/model.usdz"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-6">
            {([['is_available', '✓ Disponible'], ['is_popular', '⭐ Popular'], ['is_spicy', '🌶️ Picante']] as [keyof typeof itemForm, string][]).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={itemForm[key] as boolean} onChange={e => setItemForm(f => ({ ...f, [key]: e.target.checked }))} className="rounded" />
                {label}
              </label>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setItemModal(false)} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-medium">Cancelar</button>
            <button onClick={handleSaveItem} disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-medium">
              {saving ? 'Guardando...' : editingItem ? 'Guardar cambios' : 'Crear platillo'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Category Modal */}
      <Modal open={catModal} onClose={() => setCatModal(false)} title="Nueva Categoría" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
            <input value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} placeholder="Tortas, Tacos, Bebidas..." className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ícono (emoji)</label>
            <input value={catForm.icon} onChange={e => setCatForm(f => ({ ...f, icon: e.target.value }))} placeholder="🍔" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setCatModal(false)} className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl text-sm">Cancelar</button>
            <button onClick={handleSaveCategory} disabled={saving} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-60">
              {saving ? 'Creando...' : 'Crear categoría'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Ingredients Modal */}
      <Modal open={!!ingredientModal} onClose={() => setIngredientModal(null)} title={`Ingredientes: ${ingredientModal?.name ?? ''}`} size="md">
        {ingredientModal && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">Ingredientes actuales</h4>
              {ingredientModal.ingredients?.length ? (
                <div className="space-y-2">
                  {ingredientModal.ingredients.map(ing => (
                    <div key={ing.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5">
                      <div>
                        <span className="text-sm font-medium text-slate-800">{ing.name}</span>
                        <span className="text-xs text-slate-500 ml-2">
                          {ing.is_default ? '(por default)' : '(opcional)'}
                          {ing.extra_cost > 0 && ` · +${formatCurrency(ing.extra_cost)}`}
                        </span>
                      </div>
                      <button onClick={() => handleDeleteIngredient(ingredientModal, ing)} className="text-red-400 hover:text-red-600 text-sm transition-colors">✕</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Sin ingredientes aún</p>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-sm font-medium text-slate-700 mb-3">Agregar ingrediente</h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input value={ingForm.name} onChange={e => setIngForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: cebolla, queso..." className="col-span-2 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={ingForm.is_default} onChange={e => setIngForm(f => ({ ...f, is_default: e.target.checked }))} className="rounded" />
                  Viene por default
                </label>
                <div>
                  <input type="number" value={ingForm.extra_cost} onChange={e => setIngForm(f => ({ ...f, extra_cost: parseFloat(e.target.value) || 0 }))} placeholder="Costo extra ($)" step="0.50" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <button onClick={handleAddIngredient} disabled={saving || !ingForm.name} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
                {saving ? 'Agregando...' : 'Agregar ingrediente'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
