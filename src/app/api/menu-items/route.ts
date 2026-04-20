import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { menuItems as staticMenu } from "@/lib/menu-data";

export async function GET() {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("menu_items")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    // Fallback to static data if table doesn't exist yet
    return NextResponse.json(staticMenu);
  }

  // If table is empty, return static data (pre-schema run)
  if (!data || data.length === 0) {
    return NextResponse.json(staticMenu);
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = supabaseAdmin();

  const { data, error } = await db
    .from("menu_items")
    .insert({
      name: body.name,
      description: body.description ?? "",
      price: Number(body.price),
      category: body.category,
      image: body.image ?? "",
      available: body.available ?? true,
      popular: body.popular ?? false,
      spicy: body.spicy ?? false,
      sort_order: body.sort_order ?? 99,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const { id, ...fields } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("menu_items")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db = supabaseAdmin();
  const { error } = await db.from("menu_items").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
