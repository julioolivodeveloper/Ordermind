"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Order } from "@/types";
import { OrderCard } from "@/components/dashboard/OrderCard";
import { MenuManager } from "@/components/dashboard/MenuManager";
import { RefreshCw, Wifi, WifiOff, ClipboardList, UtensilsCrossed } from "lucide-react";
import toast from "react-hot-toast";

const COLUMNS: { key: Order["status"]; label: string; emoji: string }[] = [
  { key: "pending", label: "Pendientes", emoji: "⏳" },
  { key: "confirmed", label: "Confirmados", emoji: "✅" },
  { key: "preparing", label: "En Cocina", emoji: "👨‍🍳" },
  { key: "ready", label: "Listos", emoji: "🎯" },
  { key: "delivered", label: "Entregados", emoji: "📦" },
];

type Tab = "orders" | "menu";

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/orders");
    if (res.ok) setOrders(await res.json());
    setLoading(false);
  }, []);

  const handleStatusChange = async (id: string, status: Order["status"]) => {
    const res = await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
      toast.success("Estado actualizado");
    } else {
      toast.error("Error al actualizar el estado");
    }
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setOrders((prev) => [payload.new as Order, ...prev]);
          toast("🆕 Nuevo pedido recibido!", { icon: "🌮" });
        } else if (payload.eventType === "UPDATE") {
          setOrders((prev) => prev.map((o) => o.id === (payload.new as Order).id ? (payload.new as Order) : o));
        } else if (payload.eventType === "DELETE") {
          setOrders((prev) => prev.filter((o) => o.id !== (payload.old as Order).id));
        }
      })
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));

    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders]);

  const byStatus = (status: Order["status"]) => orders.filter((o) => o.status === status);
  const todayRevenue = orders
    .filter((o) => o.status === "delivered" && new Date(o.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Dashboard 📊</h1>
          <p className="text-gray-500 mt-1 text-sm">Acá Las Tortas El Paso</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium ${connected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
            {connected ? "En vivo" : "Reconectando..."}
          </div>
          {tab === "orders" && (
            <button onClick={fetchOrders} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              <RefreshCw size={14} /> Actualizar
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit mb-8">
        <button
          onClick={() => setTab("orders")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            tab === "orders" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <ClipboardList size={15} /> Pedidos
          {orders.filter((o) => o.status === "pending").length > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {orders.filter((o) => o.status === "pending").length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("menu")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            tab === "menu" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <UtensilsCrossed size={15} /> Gestionar Menú
        </button>
      </div>

      {/* ── TAB: ORDERS ── */}
      {tab === "orders" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Pendientes", value: byStatus("pending").length, color: "text-yellow-600", bg: "bg-yellow-50" },
              { label: "En cocina", value: byStatus("preparing").length, color: "text-orange-600", bg: "bg-orange-50" },
              { label: "Listos", value: byStatus("ready").length, color: "text-green-600", bg: "bg-green-50" },
              { label: "Ventas hoy", value: `$${todayRevenue.toFixed(0)}`, color: "text-red-600", bg: "bg-red-50" },
            ].map((stat) => (
              <div key={stat.label} className={`${stat.bg} rounded-2xl p-4`}>
                <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                <p className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Kanban */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-red-200 border-t-red-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {COLUMNS.map((col) => {
                const colOrders = byStatus(col.key);
                return (
                  <div key={col.key} className="min-w-[260px] w-[260px] shrink-0">
                    <div className="flex items-center gap-2 mb-3">
                      <span>{col.emoji}</span>
                      <h2 className="font-bold text-gray-700 text-sm">{col.label}</h2>
                      <span className="ml-auto bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">
                        {colOrders.length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {colOrders.length === 0 ? (
                        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center">
                          <p className="text-gray-400 text-sm">Sin pedidos</p>
                        </div>
                      ) : (
                        colOrders.map((order) => (
                          <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── TAB: MENU ── */}
      {tab === "menu" && <MenuManager />}
    </div>
  );
}
