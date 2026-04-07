export const dynamic = 'force-dynamic';

import { initDatabase, sql } from "../../../../lib/db.js";

function generateTimeSlots(startTime, endTime, intervalMinutes) {
  const slots = [];
  const [startHour, startMin] = String(startTime).split(":").map(Number);
  const [endHour, endMin] = String(endTime).split(":").map(Number);

  let currentHour = startHour;
  let currentMin = startMin;
  const endTotalMin = endHour * 60 + endMin;

  while (currentHour * 60 + currentMin < endTotalMin) {
    slots.push(
      `${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}`
    );

    currentMin += Number(intervalMinutes || 30);
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

    let settings = await sql`
      SELECT interval_minutes, start_time, end_time
      FROM appointment_settings
      WHERE tenant_id = ${tenantId}
      LIMIT 1
    `;

    if (!settings.length) {
      settings = [
        {
          interval_minutes: 30,
          start_time: "09:00",
          end_time: "19:00",
        },
      ];
    }

    const config = settings[0];
    const allSlots = generateTimeSlots(
      config.start_time,
      config.end_time,
      config.interval_minutes || 30
    );

    // ✅ CORRIGIDO: Agora filtra por barber_id também
    const appointments = await sql`
      SELECT LEFT(CAST(time AS text), 5) AS time
      FROM appointments
      WHERE tenant_id = ${tenantId}
        AND barber_id = ${barberId}
        AND date = ${date}
        AND status = 'confirmed'
      ORDER BY time ASC
    `;

    const occupied = new Set(appointments.map((a) => a.time));
    const times = allSlots.map((time) => ({
      time,
      available: !occupied.has(time),
    }));

    return Response.json({ times });
  } catch (error) {
    console.error("Erro ao buscar horários:", error);
    return Response.json({ times: [] });
  }
}
