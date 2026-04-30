import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/auth'

const statusSteps = [
  { key: 'new', label: 'Pedido recibido', icon: '✓' },
  { key: 'confirmed', label: 'Confirmado', icon: '👍' },
  { key: 'preparing', label: 'En preparación', icon: '👨‍🍳' },
  { key: 'ready', label: 'Listo', icon: '✅' },
  { key: 'on_the_way', label: 'En camino', icon: '🚚' },
  { key: 'completed', label: 'Entregado', icon: '🎉' },
]
const statusOrder = ['new', 'confirmed', 'preparing', 'ready', 'on_the_way', 'completed']

export default async function OrderStatusPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*), restaurant:restaurants(name, primary_color, slug, phone, whatsapp)')
    .eq('id', id)
    .single()

  if (!order) notFound()

  const currentIdx = statusOrder.indexOf(order.status)
  const restaurant = order.restaurant as any
  const isCancelled = order.status === 'cancelled'

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="text-white px-4 py-5" style={{ backgroundColor: restaurant?.primary_color ?? '#6366f1' }}>
        <div className="max-w-lg mx-auto">
          <p className="text-white/70 text-sm">{restaurant?.name}</p>
          <h1 className="font-bold text-2xl mt-1">Pedido #{order.order_number}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {isCancelled ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
            <p className="text-4xl mb-2">❌</p>
            <p className="font-bold text-red-700 text-lg">Pedido cancelado</p>
            <p className="text-red-600 text-sm mt-1">Contacta al restaurante para más información</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="font-semibold text-slate-800 mb-4">Estado del pedido</h2>
            <div className="space-y-3">
              {statusSteps.map((step, i) => {
                const done = i <= currentIdx
                const current = i === currentIdx
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 transition-all ${done ? 'text-white' : 'bg-slate-100 text-slate-400'} ${current ? 'ring-4 ring-offset-1' : ''}`}
                      style={done ? { backgroundColor: restaurant?.primary_color ?? '#6366f1' } : {}}>
                      {step.icon}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${done ? 'text-slate-800' : 'text-slate-400'}`}>{step.label}</p>
                      {current && <p className="text-xs mt-0.5" style={{ color: restaurant?.primary_color }}>Estado actual</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Order summary */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Tu pedido</h2>
          <div className="space-y-2">
            {(order.order_items as any)?.map((item: any) => (
              <div key={item.id}>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-700 font-medium">{item.quantity}x {item.item_name}</span>
                  <span className="text-slate-800 font-medium">{formatCurrency(item.subtotal)}</span>
                </div>
                {item.modifications?.map((m: any, mi: number) => (
                  <p key={mi} className={`text-xs pl-3 ${m.type === 'remove' ? 'text-red-500' : 'text-green-600'}`}>
                    {m.type === 'remove' ? '✗ Sin ' : '+ '}{m.name}
                  </p>
                ))}
              </div>
            ))}
            <div className="border-t border-slate-100 pt-2 mt-2 space-y-1 text-sm">
              {order.tax_amount > 0 && <div className="flex justify-between text-slate-500"><span>Impuesto</span><span>{formatCurrency(order.tax_amount)}</span></div>}
              {order.delivery_fee > 0 && <div className="flex justify-between text-slate-500"><span>Envío</span><span>{formatCurrency(order.delivery_fee)}</span></div>}
              <div className="flex justify-between font-bold text-slate-800 text-base"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
            </div>
          </div>
        </div>

        {/* Contact */}
        {(restaurant?.phone || restaurant?.whatsapp) && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-3">¿Necesitas ayuda?</h3>
            <div className="flex gap-3">
              {restaurant.whatsapp && (
                <a href={`https://wa.me/${restaurant.whatsapp.replace(/\D/g, '')}`} target="_blank"
                  className="flex-1 border border-green-200 text-green-700 bg-green-50 text-sm font-medium py-2.5 rounded-xl text-center hover:bg-green-100 transition-colors">
                  WhatsApp
                </a>
              )}
              {restaurant.phone && (
                <a href={`tel:${restaurant.phone}`}
                  className="flex-1 border border-slate-200 text-slate-700 text-sm font-medium py-2.5 rounded-xl text-center hover:bg-slate-50 transition-colors">
                  Llamar
                </a>
              )}
            </div>
          </div>
        )}

        <Link href={`/r/${slug}`} className="block text-center text-sm font-medium hover:underline" style={{ color: restaurant?.primary_color }}>
          ← Volver al menú
        </Link>
      </div>
    </div>
  )
}
