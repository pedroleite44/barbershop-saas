export const dynamic = 'force-dynamic';
export const revalidate = 0; // Força a revalidação total para evitar cache do Next.js

import { initDatabase, sql } from "../../../../lib/db.js";

function generateTimeSlots(startTime, endTime, intervalMinutes) {
  const slots = [];
  
  // Garantimos que os valores sejam strings antes do split
  const [startHour, startMin] = String(startTime).split(":").map(Number);
  const [endHour, endMin] = String(endTime).split(":").map(Number);

  let currentHour = startHour;
  let currentMin = startMin;
  const endTotalMin = endHour * 60 + endMin;
  const interval = Number(intervalMinutes || 15);

  while (currentHour * 60 + currentMin < endTotalMin) {
    slots.push(
      `${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}`
    );

    currentMin += interval;
    if (currentMin >= 60) {
      currentHour += Math.floor(currentMin / 60);
      currentMin = currentMin % 60;
    }
  }

  return slots;
}

export async function GET(request) {
  try {
    await initDatabase();

    const { searchParams } = new URL(request.url);
    const tenantId = Number(searchParams.get("tenant_id") || 1);
    const barberId = Number(searchParams.get("barber_id") || null);
    const date = searchParams.get("date");

    if (!date) {
      return Response.json({ error: "Data é obrigatória" }, { status: 400 });
    }

    if (!barberId) {
      return Response.json({ error: "Barbeiro é obrigatório" }, { status: 400 });
    }

    // Buscamos as configurações sempre do banco
    let settings = await sql`
      SELECT appointment_interval AS interval_minutes, opening_time AS start_time, closing_time AS end_time
      FROM tenant_settings
      WHERE tenant_id = ${tenantId}
      LIMIT 1
    `;

    if (!settings.length) {
      settings = [
        {
          interval_minutes: 15,
          start_time: "09:00",
          end_time: "19:00",
        },
      ];
    }

    const config = settings[0];
    const allSlots = generateTimeSlots(
      config.start_time,
      config.end_time,
      config.interval_minutes
    );

    // MODIFICAÇÃO: Alterado de status = 'confirmed' para status != 'cancelled'
    // Isso garante que horários pendentes também fiquem indisponíveis.
    const appointments = await sql`
      SELECT to_char(time, 'HH24:MI') AS time
      FROM appointments
      WHERE tenant_id = ${tenantId}
        AND barber_id = ${barberId}
        AND date = ${date}
        AND status != 'cancelled'
      ORDER BY time ASC
    `;

    const occupied = new Set(appointments.map((a) => a.time));
    const times = allSlots.map((time) => ({
      time,
      available: !occupied.has(time),
    }));

    // Criamos a resposta e adicionamos headers para desativar cache em todos os níveis
    const response = Response.json({ times });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;

  } catch (error) {
    console.error("Erro ao buscar horários:", error);
    return Response.json({ error: "Erro interno", details: error.message }, { status: 500 });
  }
}