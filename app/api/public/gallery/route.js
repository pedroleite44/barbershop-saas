import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tenant_id = searchParams.get("tenant_id");

  if (!tenant_id) {
    return NextResponse.json({ success: false, error: "tenant_id é obrigatório" }, { status: 400 });
  }

  try {
    const images = await sql`
      SELECT id, image_url, title 
      FROM tenant_gallery 
      WHERE tenant_id = ${parseInt(tenant_id)}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ success: true, data: images });
  } catch (error) {
    console.error("Erro ao buscar galeria:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
