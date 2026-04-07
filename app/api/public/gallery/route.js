import { initDatabase, sql } from "../../../../lib/db.js";

export async function GET(req) {
  try {
    await initDatabase();

    const { searchParams } = new URL(req.url);
    const tenantId = Number(searchParams.get("tenant_id") || 1);

    const data = await sql`
      SELECT
        id,
        tenant_id,
        image_url,
        COALESCE(title, '') AS title,
        COALESCE(order_index, 0) AS order_index,
        created_at
      FROM tenant_gallery
      WHERE tenant_id = ${tenantId}
      ORDER BY order_index ASC, created_at DESC
    `;

    return Response.json({ 
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error("ERRO GET PUBLIC GALLERY:", error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}
