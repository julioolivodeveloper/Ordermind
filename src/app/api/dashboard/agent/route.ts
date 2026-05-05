import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRestaurantAccess } from '@/lib/auth'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const tools: Anthropic.Tool[] = [
  {
    name: 'get_context',
    description: 'Get restaurant info, categories, menu items, and recent stats. Call this first to understand the current state.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'create_menu_item',
    description: 'Create a new menu item. If no image_url is provided, ask the user to send an image first.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        category_id: { type: 'string', description: 'Category ID from get_context' },
        image_url: { type: 'string', description: 'URL from uploaded image, optional' },
        is_popular: { type: 'boolean' },
      },
      required: ['name', 'price'],
    },
  },
  {
    name: 'update_menu_item',
    description: 'Update an existing menu item (price, name, description, availability, etc)',
    input_schema: {
      type: 'object',
      properties: {
        item_id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        is_available: { type: 'boolean' },
        is_popular: { type: 'boolean' },
        discount_percent: { type: 'number' },
      },
      required: ['item_id'],
    },
  },
  {
    name: 'create_promotion',
    description: 'Create a promotional banner shown on the public menu',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        discount_percent: { type: 'number' },
        promo_code: { type: 'string' },
        valid_until: { type: 'string', description: 'ISO date string, e.g. 2025-12-31' },
      },
      required: ['title'],
    },
  },
  {
    name: 'create_coupon',
    description: 'Create a discount coupon code',
    input_schema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'The coupon code customers will enter' },
        discount_type: { type: 'string', enum: ['percent', 'fixed'] },
        discount_value: { type: 'number' },
        min_order_amount: { type: 'number' },
        max_uses: { type: 'number' },
        valid_until: { type: 'string' },
      },
      required: ['code', 'discount_type', 'discount_value'],
    },
  },
  {
    name: 'get_sales_stats',
    description: 'Get sales statistics: total orders, revenue, top items, recent orders',
    input_schema: {
      type: 'object',
      properties: {
        days: { type: 'number', description: 'Number of days to look back, default 7' },
      },
      required: [],
    },
  },
  {
    name: 'toggle_category_items',
    description: 'Enable or disable all items in a category',
    input_schema: {
      type: 'object',
      properties: {
        category_id: { type: 'string' },
        is_available: { type: 'boolean' },
      },
      required: ['category_id', 'is_available'],
    },
  },
  {
    name: 'request_image',
    description: 'Ask the user to send an image. Use this when creating items that need a photo.',
    input_schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'What the image is for' },
      },
      required: ['reason'],
    },
  },
]

async function executeTool(name: string, input: any, restaurantId: string) {
  const supabase = await createClient()
  const admin = createAdminClient()

  if (name === 'get_context') {
    const [{ data: restaurant }, { data: categories }, { data: items }] = await Promise.all([
      admin.from('restaurants').select('name, slug, primary_color, currency, pickup_enabled, delivery_enabled').eq('id', restaurantId).single(),
      supabase.from('menu_categories').select('id, name, icon, is_active').eq('restaurant_id', restaurantId).order('sort_order'),
      supabase.from('menu_items').select('id, name, price, is_available, is_popular, category_id, discount_percent').eq('restaurant_id', restaurantId).order('name'),
    ])
    return { restaurant, categories, items }
  }

  if (name === 'create_menu_item') {
    const { data, error } = await supabase.from('menu_items').insert({
      ...input,
      restaurant_id: restaurantId,
      is_available: true,
      is_spicy: false,
      sort_order: 0,
    }).select().single()
    if (error) return { error: error.message }
    return { success: true, item: data }
  }

  if (name === 'update_menu_item') {
    const { item_id, ...fields } = input
    const { error } = await supabase.from('menu_items').update(fields).eq('id', item_id).eq('restaurant_id', restaurantId)
    if (error) return { error: error.message }
    return { success: true }
  }

  if (name === 'create_promotion') {
    const { data, error } = await supabase.from('promotions').insert({
      ...input,
      restaurant_id: restaurantId,
      is_active: true,
      sort_order: 0,
    }).select().single()
    if (error) return { error: error.message }
    return { success: true, promotion: data }
  }

  if (name === 'create_coupon') {
    const { data, error } = await supabase.from('coupons').insert({
      ...input,
      restaurant_id: restaurantId,
      is_active: true,
      current_uses: 0,
    }).select().single()
    if (error) return { error: error.message }
    return { success: true, coupon: data }
  }

  if (name === 'get_sales_stats') {
    const days = input.days ?? 7
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const { data: orders } = await admin.from('orders').select('id, total, status, created_at').eq('restaurant_id', restaurantId).gte('created_at', since).order('created_at', { ascending: false })
    const { data: topItems } = await admin.from('order_items').select('item_name, quantity').eq('orders.restaurant_id', restaurantId)
    const total = (orders ?? []).reduce((s, o) => s + (o.total ?? 0), 0)
    return {
      period_days: days,
      total_orders: (orders ?? []).length,
      total_revenue: total,
      recent_orders: (orders ?? []).slice(0, 5),
    }
  }

  if (name === 'toggle_category_items') {
    const { error } = await supabase.from('menu_items').update({ is_available: input.is_available }).eq('category_id', input.category_id).eq('restaurant_id', restaurantId)
    if (error) return { error: error.message }
    return { success: true }
  }

  if (name === 'request_image') {
    return { needs_image: true, reason: input.reason }
  }

  return { error: 'Unknown tool' }
}

export async function POST(req: Request) {
  try {
    const profile = await requireRestaurantAccess()
    const restaurantId = profile.restaurant_id!
    const { messages, imageUrl } = await req.json()

    // If user sent an image, attach it to the last user message
    const anthropicMessages: Anthropic.MessageParam[] = messages.map((m: any) => {
      if (m.role === 'user' && m === messages[messages.length - 1] && imageUrl) {
        return {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'url', url: imageUrl } },
            { type: 'text', text: m.content },
          ],
        }
      }
      return { role: m.role, content: m.content }
    })

    const systemPrompt = `Eres un asistente de IA para el restaurante. Ayudas al dueño a gestionar su menú, promociones, cupones y estadísticas de ventas.

Siempre responde en español. Sé conciso y amigable.

Cuando el usuario pida crear un platillo, PRIMERO llama get_context para conocer las categorías disponibles. Si no hay imagen, usa request_image para pedirla antes de crear el platillo.

Cuando hagas cambios, confirma brevemente qué hiciste. Si hay errores, explica qué salió mal en términos simples.

No inventes datos — usa siempre get_context o get_sales_stats para información real.`

    let response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages: anthropicMessages,
    })

    // Agentic loop — execute tools until done
    while (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use') as Anthropic.ToolUseBlock[]
      const toolResults: Anthropic.ToolResultBlockParam[] = []

      for (const block of toolUseBlocks) {
        const result = await executeTool(block.name, block.input, restaurantId)
        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) })
      }

      anthropicMessages.push({ role: 'assistant', content: response.content })
      anthropicMessages.push({ role: 'user', content: toolResults })

      response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        tools,
        messages: anthropicMessages,
      })
    }

    const text = response.content.find(b => b.type === 'text') as Anthropic.TextBlock | undefined
    const needsImage = response.content.some(b => b.type === 'tool_use' && (b as any).name === 'request_image')

    return NextResponse.json({ reply: text?.text ?? '', needs_image: needsImage })
  } catch (e: any) {
    console.error('Agent error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
