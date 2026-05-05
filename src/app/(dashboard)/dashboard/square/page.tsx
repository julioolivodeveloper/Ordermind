import { requireRestaurantAccess } from '@/lib/auth'
import { getSquareConnection } from '@/lib/square'
import { SquareConnect } from '@/components/dashboard/SquareConnect'
import { SquareDashboard } from '@/components/dashboard/SquareDashboard'

export default async function SquarePage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>
}) {
  const profile = await requireRestaurantAccess()
  const sp = await searchParams
  const isSandbox = process.env.SQUARE_ENVIRONMENT !== 'production'

  const connection = await getSquareConnection(profile.restaurant_id!)

  return (
    <div className="p-6 max-w-2xl bg-[#111111] min-h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Square Payments</h1>
        <p className="text-white/40 text-sm mt-1">Conecta Square para pagos, catálogo y transacciones</p>
      </div>

      {connection ? (
        <SquareDashboard connection={connection as any} isSandbox={isSandbox} />
      ) : (
        <SquareConnect
          connected={false}
          error={sp.error ?? null}
          justConnected={sp.connected === 'true'}
          isSandbox={isSandbox}
        />
      )}
    </div>
  )
}
