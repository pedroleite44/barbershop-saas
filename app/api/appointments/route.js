import { initDatabase, sql } from "../../../lib/db.js";
import { requireAuth } from "../../../lib/auth.js";

export async function GET(req) {
  try {
    await initDatabase();

    const { auth, error } = requireAuth(req, ["admin"]);
    if (error) return error;

    const data = await sql`
      SELECT
        a.id,
        a.tenant_id,
        a.barber_id,
        a.date,
        LEFT(CAST(a.time AS text), 5) AS time,
        a.phone,
        COALESCE(a.client_name, '') AS client_name,
        COALESCE(b.name, 'Sem barbeiro') AS barber_name,
        a.status,
        a.created_at
      FROM appointments a
      LEFT JOIN barbers b ON b.id = a.barber_id
      WHERE a.tenant_id = ${auth.tenant_id}
      ORDER BY a.date DESC, a.time DESC
    `;

    return Response.json({ 
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error("ERRO GET APPOINTMENTS:", error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await initDatabase();

    const { auth, error } = requireAuth(req, ["admin"]);
    if (error) return error;

    const body = await req.json();

    const barber_id = body.barber_id || body.barberId || null;
    const date = body.date || body.appointmentDate;
    const time = body.time || body.appointmentTime;
    const phone = body.phone || body.clientPhone;
    const client_name = body.client_name || body.clientName || null;

    if (!date || !time || !phone) {
      return Response.json(
        { error: "Data, hora e telefone são obrigatórios" },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO appointments (
        tenant_id, barber_id, date, time, phone, client_name, status, created_at, updated_at
      )
      VALUES (
        ${auth.tenant_id},
        ${barber_id ? Number(barber_id) : null},
        ${date},
        ${time},
        ${phone},
        ${client_name},
        'confirmed',
        NOW(),
        NOW()
      )
      RETURNING
        id,
        tenant_id,
        barber_id,
        date,
        LEFT(CAST(time AS text), 5) AS time,
        phone,
        client_name,
        status,
        created_at
    `;

    return Response.json({ 
      success: true,
      data: result[0]
    }, { status: 201 });
  } catch (error) {
    console.error("ERRO POST APPOINTMENTS:", error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { auth, error } = requireAuth(req, ["admin"]);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!id) {
      return Response.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    await sql`
      DELETE FROM appointments
      WHERE id = ${id} AND tenant_id = ${auth.tenant_id}
    `;

    return Response.json({ 
      success: true,
      message: 'Agendamento deletado com sucesso'
    });
  } catch (error) {
    console.error("ERRO DELETE APPOINTMENTS:", error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}
