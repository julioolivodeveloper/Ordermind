import type { Order, OrderItem } from '@/types'

const TYPE_LABEL: Record<string, string> = {
  pickup: 'PICKUP',
  delivery: 'DELIVERY',
  dine_in: 'DINE IN',
}

function pad(str: string, width: number) {
  return str.length >= width ? str : str + ' '.repeat(width - str.length)
}

function buildTicketHTML(order: Order, restaurantName: string): string {
  const items = (order.order_items ?? []) as OrderItem[]
  const now = new Date(order.created_at)
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const itemRows = items.map(item => {
    const name = item.item_name.length > 22 ? item.item_name.slice(0, 22) + '…' : item.item_name
    const price = `$${(item.item_price * item.quantity).toFixed(2)}`
    const line = `${item.quantity}x ${pad(name, 23)} ${price}`
    const mods = ((item.modifications as any[]) ?? [])
    const modLines = mods
      .map((m: any) => `   ${m.type === 'remove' ? '✗ NO' : '+'} ${m.name}`)
      .join('\n')
    const noteLine = item.notes ? `   * ${item.notes}` : ''
    return [line, modLines, noteLine].filter(Boolean).join('\n')
  }).join('\n')

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Order #${order.order_number}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    line-height: 1.4;
    width: 80mm;
    padding: 4mm 3mm;
    color: #000;
    background: #fff;
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .big { font-size: 18px; font-weight: bold; }
  .huge { font-size: 28px; font-weight: bold; }
  .divider { border-top: 1px dashed #000; margin: 4px 0; }
  .double { border-top: 2px solid #000; margin: 4px 0; }
  pre { font-family: inherit; font-size: 12px; white-space: pre-wrap; }
  .type-badge {
    display: inline-block;
    border: 2px solid #000;
    padding: 1px 6px;
    font-weight: bold;
    font-size: 13px;
    letter-spacing: 1px;
  }
  .total-row { font-size: 14px; font-weight: bold; }
  @media print {
    body { width: 80mm; }
    @page { size: 80mm auto; margin: 0; }
  }
</style>
</head>
<body onload="window.print(); window.close();">

<div class="center">
  <p class="bold">${restaurantName.toUpperCase()}</p>
  <p class="divider"></p>
  <p class="huge">#${order.order_number}</p>
  <p class="type-badge">${TYPE_LABEL[order.order_type] ?? order.order_type.toUpperCase()}</p>
  <p style="margin-top:4px">${dateStr} &nbsp; ${timeStr}</p>
</div>

<div class="divider"></div>

<p><strong>${order.customer_name}</strong>${order.customer_phone ? ' · ' + order.customer_phone : ''}</p>
${order.delivery_address ? `<p style="font-size:11px">${(order.delivery_address as any).street ?? ''}</p>` : ''}

<div class="divider"></div>

<pre>${itemRows}</pre>

<div class="divider"></div>

${order.discount_amount && order.discount_amount > 0 ? `<p style="text-align:right">Subtotal: $${order.subtotal.toFixed(2)}</p>
<p style="text-align:right">Discount: -$${order.discount_amount.toFixed(2)}</p>` : ''}
${order.tax_amount && order.tax_amount > 0 ? `<p style="text-align:right">Tax: $${order.tax_amount.toFixed(2)}</p>` : ''}
${order.delivery_fee && order.delivery_fee > 0 ? `<p style="text-align:right">Delivery: $${order.delivery_fee.toFixed(2)}</p>` : ''}

<div class="double"></div>
<p class="total-row" style="text-align:right">TOTAL: $${order.total.toFixed(2)}</p>
<p style="text-align:right;font-size:11px">${order.payment_method === 'cash' ? 'CASH' : order.payment_method === 'stripe' ? 'CARD (Stripe)' : order.payment_method.toUpperCase()}</p>

${order.notes ? `<div class="divider"></div>
<p class="bold">NOTE:</p>
<p>${order.notes}</p>` : ''}

<div class="divider"></div>
<p class="center" style="font-size:10px; margin-top:4px">Thank you!</p>

</body>
</html>`
}

export function printTicket(order: Order, restaurantName: string): boolean {
  const html = buildTicketHTML(order, restaurantName)
  const popup = window.open('', '_blank', 'width=420,height=700,scrollbars=yes')
  if (!popup) return false
  popup.document.write(html)
  popup.document.close()
  return true
}
