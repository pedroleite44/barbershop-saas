import { initDatabase, sql } from "../../../lib/db.js";

export async function GET(req) {
  await initDatabase();

  const { searchParams } = new URL(req.url);
  const tenantId = Number(searchParams.get("tenant_id"));

  const result = await sql`
    SELECT *
    FROM tenant_settings
    WHERE tenant_id = ${tenantId}
    LIMIT 1
  `;

  return Response.json(result[0] || {});
}

export async function POST(req) {
  try {
    await initDatabase();

    const body = await req.json();
    const tenantId = req.headers.get("x-tenant-id");

    if (!tenantId) {
      return Response.json({ error: "Tenant ID não fornecido" }, { status: 400 });
    }

    // CORREÇÃO: Adicionado logo_url e banner_url no comando UPDATE
    const result = await sql`
      UPDATE tenant_settings SET
        name = ${body.name},
        phone = ${body.phone},
        whatsapp = ${body.whatsapp},
        address = ${body.address},
        city = ${body.city},
        state = ${body.state},
        zip_code = ${body.zip_code},
        opening_time = ${body.opening_time},
        closing_time = ${body.closing_time},
        appointment_interval = ${body.appointment_interval},
        primary_color = ${body.primary_color},
        secondary_color = ${body.secondary_color},
        accent_color = ${body.accent_color},
        logo_url = ${body.logo_url || ''},
        banner_url = ${body.banner_url || ''},
        instagram_url = ${body.instagram_url || ''},
        description = ${body.description},
        updated_at = NOW()
      WHERE tenant_id = ${tenantId}
      RETURNING *
    `;

    return Response.json(result[0]);
  } catch (error) {
    console.error("ERRO AO SALVAR CONFIGURAÇÕES:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}