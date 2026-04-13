import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const tenant_id = searchParams.get("tenant_id");

  try {
    let result;
    
    if (slug) {
      result = await sql`
        SELECT *, tenant_id as id FROM tenant_settings 
        WHERE slug = ${slug}
        LIMIT 1
      `;
    } else if (tenant_id) {
      result = await sql`
        SELECT *, tenant_id as id FROM tenant_settings 
        WHERE tenant_id = ${parseInt(tenant_id)}
        LIMIT 1
      `;
    } else {
      return NextResponse.json({ success: false, error: "Identificador não fornecido" }, { status: 400 });
    }

    if (!result || result.length === 0) {
      return NextResponse.json({ success: false, error: "Barbearia não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: result[0] 
    }, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      }
    });
  } catch (error) {
    console.error("Erro na API pública:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}