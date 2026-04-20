"use client";

import { Order } from "@/types";
import { Clock, User, Phone, ChevronDown } from "lucide-react";
import { useState } from "react";

const STATUS_CONFIG = {
  pending: {
    label: "Pendiente",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    dot: "bg-yellow-400",
  },
  confirmed: {
    label: "Confirmado",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    dot: "bg-blue-400",
  },
  preparing: {
    label: "En preparación",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    dot: "bg-orange-400",
  },
  ready: {
    label: "Listo",
    color: "bg-green-100 text-green-800 border-green-200",
    dot: "bg-green-400",
  },
  delivered: {
    label: "Entregado",
    color: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
  },
  cancelled: {
    label: "Cancelado",
    color: "bg-red-100 text-red-800 border-red-200",
    dot: "bg-red-400",
  },
};

const STATUS_FLOW = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "delivered",
] as const;

interface OrderCardProps {
  order: Order;
  onStatusChange: (id: string, status: Order["status"]) => void;
}

export function OrderCard({ order, onStatusChange }: OrderCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const config = STATUS_CONFIG[order.status];

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `hace ${mins}m`;
    return `hace ${Math.floor(mins / 60)}h`;
  };

  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status as typeof STATUS_FLOW[number]) + 1];

  const handleAdvance = async () => {
    if (!nextStatus || updating) return;
    setUpdating(true);
    await onStatusChange(order.id, nextStatus);
    setUpdating(false);
  };

  return (
    <div className={`bg-white rounded-2xl border-2 transition-all ${order.status === "ready" ? "border-green-300 shadow-green-100 shadow-md" : "border-gray-100"}`}>
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-gray-400">
                #{order.id.slice(0, 8)}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${config.color}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                {config.label}
              </span>
            </div>
            <p className="font-bold text-gray-900">{order.customer_name}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-black text-gray-900 text-lg">
              ${order.total.toFixed(2)}
            </p>
            <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
              <Clock size={11} /> {timeAgo(order.created_at)}
            </p>
          </div>
        </div>

        {/* Contact */}
        <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <Phone size={11} /> {order.customer_phone}
          </span>
        </div>

        {/* Items summary */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <span className="font-medium">
            {order.items.reduce((s, i) => s + i.quantity, 0)} artículos
          </span>
          <ChevronDown
            size={16}
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>

        {expanded && (
          <ul className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex justify-between text-sm text-gray-700"
              >
                <span>
                  {item.quantity}× {item.name}
                </span>
                <span className="font-medium">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </li>
            ))}
            {order.notes && (
              <li className="text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1 mt-2">
                📝 {order.notes}
              </li>
            )}
          </ul>
        )}

        {/* Actions */}
        {nextStatus && order.status !== "cancelled" && (
          <button
            onClick={handleAdvance}
            disabled={updating}
            className="mt-4 w-full bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors"
          >
            {updating ? "Actualizando..." : `→ Marcar como ${STATUS_CONFIG[nextStatus].label}`}
          </button>
        )}
      </div>
    </div>
  );
}
