import { requireRestaurantAccess } from '@/lib/auth'
import { getSquareConnection } from '@/lib/square'
import { SquareConnect } from '@/components/dashboard/SquareConnect'

export default async function SquarePage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>
}) {
  const profile = await requireRestaurantAccess()
  const sp = await searchParams

  const connection = await getSquareConnection(profile.restaurant_id!)

  return (
    <div className="p-6 max-w-2xl bg-[#111111] min-h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Square Payments</h1>
        <p className="text-white/40 text-sm mt-1">Conecta tu cuenta de Square para aceptar pagos con tarjeta</p>
      </div>

      <SquareConnect
        connected={!!connection}
        merchantId={connection?.merchant_id}
        connectedAt={connection?.created_at}
        error={sp.error ?? null}
        justConnected={sp.connected === 'true'}
        isSandbox={process.env.SQUARE_ENVIRONMENT !== 'production'}
      />
    </div>
  )
}
