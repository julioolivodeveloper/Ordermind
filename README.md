# 🌮 Acá Las Tortas El Paso — Sistema de Pedidos Online

Sistema completo de pedidos online para restaurante con menú animado, carrito, checkout con Stripe y dashboard en tiempo real.

## Stack

- **Next.js 16** + TypeScript + App Router
- **Tailwind CSS v4** — estilos
- **Framer Motion** — animaciones
- **Supabase** — base de datos + realtime
- **Stripe** — pagos
- **Zustand** — estado del carrito

## Configuración inicial

### 1. Variables de entorno

Copia `.env.local` y rellena los valores reales:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Supabase — Schema

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ve a **SQL Editor** y ejecuta el contenido de `supabase/schema.sql`
3. Esto crea la tabla `orders`, habilita RLS y activa Realtime

### 3. Stripe — Webhook local

```bash
# Instala Stripe CLI
brew install stripe/stripe-cli/stripe

# Inicia el listener de webhooks
stripe listen --forward-to localhost:3000/api/webhook

# Copia el webhook secret que aparece (whsec_...) en .env.local
```

### 4. Iniciar el servidor

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Páginas

| Ruta | Descripción |
|------|------------|
| `/` | Hero + menú destacado |
| `/menu` | Menú completo con filtros y búsqueda |
| `/checkout` | Formulario de datos + pago con Stripe |
| `/success` | Confirmación de pedido |
| `/dashboard` | Kanban en tiempo real con Supabase |

## API Routes

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/checkout` | POST | Crea sesión de Stripe |
| `/api/orders` | GET | Lista órdenes |
| `/api/orders` | PATCH | Actualiza estado de orden |
| `/api/webhook` | POST | Webhook de Stripe |
