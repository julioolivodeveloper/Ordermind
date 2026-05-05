export interface PrintOrder {
  order_number: number
  created_at: string
  customer_name: string
  customer_phone?: string | null
  order_type: string
  payment_method: string
  payment_status: string
  notes?: string | null
  subtotal: number
  tax_amount: number
  delivery_fee: number
  discount_amount: number
  total: number
  order_items: Array<{
    quantity: number
    item_name: string
    item_price: number
    subtotal: number
    modifications?: Array<{ type: string; name: string; extra_cost?: number }>
    notes?: string | null
  }>
}

export interface PrintRestaurant {
  name: string
  address?: string | null
  phone?: string | null
}

const typeLabel: Record<string, string> = {
  pickup: 'Para llevar', delivery: 'Delivery', dine_in: 'En mesa',
}
const payLabel: Record<string, string> = {
  cash: 'Efectivo', card: 'Tarjeta', stripe: 'Tarjeta (Stripe)',
  square: 'Tarjeta (Square)', paypal: 'PayPal',
}

function fmt(n: number) {
  return `$${(n ?? 0).toFixed(2)}`
}

export function printReceipt(order: PrintOrder, restaurant: PrintRestaurant) {
  const date = new Date(order.created_at).toLocaleString('es-MX', {
    dateStyle: 'short', timeStyle: 'short',
  })

  const itemsHtml = order.order_items.map(item => `
    <div class="item">
      <div class="item-row">
        <span>${item.quantity}x ${item.item_name}</span>
        <span>${fmt(item.subtotal)}</span>
      </div>
      ${(item.modifications ?? []).map(m => `
        <div class="mod ${m.type === 'remove' ? 'remove' : 'add'}">
          ${m.type === 'remove' ? '✗ Sin ' : '+ '}${m.name}${m.extra_cost ? ` (+${fmt(m.extra_cost)})` : ''}
        </div>
      `).join('')}
      ${item.notes ? `<div class="item-note">"${item.notes}"</div>` : ''}
    </div>
  `).join('')

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Recibo #${order.order_number}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    width: 80mm;
    padding: 4mm;
    color: #000;
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .large { font-size: 16px; }
  .divider { border-top: 1px dashed #000; margin: 6px 0; }
  .row { display: flex; justify-content: space-between; margin: 2px 0; }
  .item { margin: 4px 0; }
  .item-row { display: flex; justify-content: space-between; font-weight: bold; }
  .mod { font-size: 11px; padding-left: 12px; }
  .remove { color: #c00; }
  .add { color: #060; }
  .item-note { font-size: 11px; padding-left: 12px; font-style: italic; color: #555; }
  .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; }
  @media print {
    body { width: 80mm; }
    @page { size: 80mm auto; margin: 0; }
  }
</style>
</head>
<body>
  <div class="center bold large">${restaurant.name}</div>
  ${restaurant.address ? `<div class="center">${restaurant.address}</div>` : ''}
  ${restaurant.phone ? `<div class="center">Tel: ${restaurant.phone}</div>` : ''}
  <div class="divider"></div>
  <div class="center bold">RECIBO #${order.order_number}</div>
  <div class="center">${date}</div>
  <div class="divider"></div>
  <div class="row"><span>Cliente:</span><span>${order.customer_name}</span></div>
  ${order.customer_phone ? `<div class="row"><span>Tel:</span><span>${order.customer_phone}</span></div>` : ''}
  <div class="row"><span>Tipo:</span><span>${typeLabel[order.order_type] ?? order.order_type}</span></div>
  <div class="divider"></div>
  ${itemsHtml}
  <div class="divider"></div>
  <div class="row"><span>Subtotal</span><span>${fmt(order.subtotal)}</span></div>
  ${order.tax_amount > 0 ? `<div class="row"><span>Impuesto</span><span>${fmt(order.tax_amount)}</span></div>` : ''}
  ${order.delivery_fee > 0 ? `<div class="row"><span>Delivery</span><span>${fmt(order.delivery_fee)}</span></div>` : ''}
  ${order.discount_amount > 0 ? `<div class="row"><span>Descuento</span><span>-${fmt(order.discount_amount)}</span></div>` : ''}
  <div class="divider"></div>
  <div class="total-row"><span>TOTAL</span><span>${fmt(order.total)}</span></div>
  <div class="row"><span>Pago:</span><span>${payLabel[order.payment_method] ?? order.payment_method}</span></div>
  ${order.notes ? `<div class="divider"></div><div>Nota: ${order.notes}</div>` : ''}
  <div class="divider"></div>
  <div class="center">¡Gracias por su visita!</div>
  <div class="center">Powered by Ordermind</div>
</body>
</html>`

  const win = window.open('', '_blank', 'width=340,height=600,scrollbars=yes')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 400)
}
