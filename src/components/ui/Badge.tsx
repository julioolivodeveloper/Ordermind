import type { RestaurantStatus, OrderStatus } from '@/types'

const statusColors: Record<string, string> = {
  // Restaurant status
  active: 'bg-green-100 text-green-700 border-green-200',
  demo: 'bg-blue-100 text-blue-700 border-blue-200',
  suspended: 'bg-red-100 text-red-700 border-red-200',
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  // Order status
  new: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  preparing: 'bg-orange-100 text-orange-700 border-orange-200',
  ready: 'bg-green-100 text-green-700 border-green-200',
  on_the_way: 'bg-purple-100 text-purple-700 border-purple-200',
  completed: 'bg-slate-100 text-slate-600 border-slate-200',
  cancelled: 'bg-red-100 text-red-600 border-red-200',
}

interface BadgeProps {
  status: RestaurantStatus | OrderStatus | string
  label: string
  size?: 'sm' | 'md'
}

export function Badge({ status, label, size = 'md' }: BadgeProps) {
  const color = statusColors[status] ?? 'bg-slate-100 text-slate-600 border-slate-200'
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'
  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${color} ${sizeClass}`}>
      {label}
    </span>
  )
}
