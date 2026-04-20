import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { CartItem } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { items, customer } = await req.json();

    if (!items?.length) {
      return NextResponse.json({ error: "No items in cart" }, { status: 400 });
    }

    const total = items.reduce(
      (sum: number, item: CartItem) => sum + item.price * item.quantity,
      0
    );

    const db = supabaseAdmin();
    const { data: order, error } = await db
      .from("orders")
      .insert({
        items,
        total,
        status: "confirmed",
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        notes: customer.notes ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error("DB error:", error);
      // Return success anyway — simulation must not fail
    }

    return NextResponse.json({ orderId: order?.id ?? null });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
