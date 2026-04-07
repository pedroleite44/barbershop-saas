import { initDatabase, sql } from "../../../../lib/db.js";
import { getAuthFromRequest } from "../../../../lib/auth.js";

export async function GET(request) {
  try {
    await initDatabase();

    const auth = getAuthFromRequest(request);
    const { searchParams } = new URL(request.url);
    const tenantId = Number(auth?.tenant_id || searchParams.get("tenant_id") || 1);

    const result = await sql`
      SELECT *
      FROM appointment_settings
      WHERE tenant_id = ${tenantId}
      LIMIT 1
    `;

    if (!result.length) {
      const created = await sql`
        INSERT INTO appointment_settings (
          tenant_id, interval_minutes, start_time, end_time, created_at, updated_at
        )
        VALUES (${tenantId}, 30, '09:00', '19:00', NOW(), NOW())
        RETURNING *
      `;
      return Response.json(created[0]);
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await initDatabase();

    const auth = getAuthFromRequest(request);
    const body = await request.json();

    const tenantId = Number(auth?.tenant_id || body.tenantId || 1);
    const intervalMinutes = Number(body.intervalMinutes || 30);
    const startTime = body.startTime || "09:00";
    const endTime = body.endTime || "19:00";

    const result = await sql`
      INSERT INTO appointment_settings (
        tenant_id, interval_minutes, start_time, end_time, created_at, updated_at
      )
      VALUES (${tenantId}, ${intervalMinutes}, ${startTime}, ${endTime}, NOW(), NOW())
      ON CONFLICT (tenant_id)
      DO UPDATE SET
        interval_minutes = EXCLUDED.interval_minutes,
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        updated_at = NOW()
      RETURNING *
    `;

    await sql`
      INSERT INTO tenant_settings (
        tenant_id, opening_time, closing_time, appointment_interval, created_at, updated_at
      )
      VALUES (${tenantId}, ${startTime}, ${endTime}, ${intervalMinutes}, NOW(), NOW())
      ON CONFLICT (tenant_id)
      DO UPDATE SET
        opening_time = EXCLUDED.opening_time,
        closing_time = EXCLUDED.closing_time,
        appointment_interval = EXCLUDED.appointment_interval,
        updated_at = NOW()
    `;

    return Response.json(result[0]);
  } catch (error) {
    console.error("Erro ao atualizar configurações:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
