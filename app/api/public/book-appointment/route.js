import { initDatabase, sql } from "../../../../lib/db.js";

export async function POST(request) {
  try {
    await initDatabase();
    const body = await request.json();
    
    const tenantId = Number(body.tenantId || body.tenant_id || 1);
    const barberId = Number(body.barberId || body.barber_id);
    const clientName = body.clientName || body.client_name || "Cliente";
    const clientPhone = body.clientPhone || body.phone;
    const appointmentDate = body.appointmentDate || body.date;
    const appointmentTime = body.appointmentTime || body.time;
    const serviceIds = body.serviceIds || [];
    const totalPrice = parseFloat(body.totalPrice || 0);

    if (!tenantId || !barberId || !clientPhone || !appointmentDate || !appointmentTime) {
      return Response.json({ success: false, error: "Dados incompletos" }, { status: 400 });
    }

    let serviceNames = "Serviço não especificado";
    if (serviceIds.length > 0) {
      const ids = serviceIds.map(id => Number(id));
      const services = await sql`SELECT name FROM services WHERE id = ANY(${ids})`;
      serviceNames = services.map(s => s.name).join(", ");
    }

    const serviceIdsString = Array.isArray(serviceIds) ? serviceIds.join(",") : String(serviceIds);

    const result = await sql`
      INSERT INTO appointments (
        tenant_id, barber_id, date, time, phone, client_name, 
        service_ids, service_names, total_price, status, created_at, updated_at
      ) VALUES (
        ${tenantId}, ${barberId}, ${appointmentDate}, ${appointmentTime}, ${clientPhone}, ${clientName},
        ${serviceIdsString}, ${serviceNames}, ${totalPrice}, 'confirmed', NOW(), NOW()
      ) RETURNING id;
    `;

    console.log("✅ Agendado com sucesso! ID:", result[0].id);
    return Response.json({ success: true, data: result[0] });

  } catch (error) {
    console.error("❌ ERRO NO AGENDAMENTO:", error.message);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    await initDatabase();
    const { searchParams } = new URL(request.url);
    const tenantId = Number(searchParams.get("tenant_id") || 1);
    const date = searchParams.get("date");

    if (!date) return Response.json({ success: false, error: "Data é obrigatória" }, { status: 400 });

    const result = await sql`
      SELECT id, tenant_id, barber_id, date, LEFT(CAST(time AS text), 5) AS time, 
             phone, client_name, service_names, total_price, status, created_at
      FROM appointments
      WHERE tenant_id = ${tenantId} AND date = ${date} AND status = 'confirmed'
      ORDER BY time
    `;

    return Response.json({ success: true, data: result });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}