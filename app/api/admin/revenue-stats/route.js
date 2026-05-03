import { initDatabase, sql } from "../../../../lib/db.js";

export async function GET(request) {
  try {
    await initDatabase();
    
    const { searchParams } = new URL(request.url);
    const tenantId = Number(searchParams.get("tenant_id") || 1);

    // 1. Faturamento de HOJE (confirmados + concluídos hoje)
    const todayResult = await sql`
      SELECT COALESCE(SUM(total_price), 0) as total 
      FROM appointments 
      WHERE tenant_id = ${tenantId} 
      AND date = CURRENT_DATE 
      AND status IN ('confirmed', 'completed')
    `;

    // 2. Faturamento da SEMANA (Últimos 7 dias - confirmados + concluídos)
    const weekResult = await sql`
      SELECT COALESCE(SUM(total_price), 0) as total 
      FROM appointments 
      WHERE tenant_id = ${tenantId} 
      AND date >= CURRENT_DATE - INTERVAL '7 days' 
      AND status IN ('confirmed', 'completed')
    `;

    // 3. Faturamento do MÊS (mês atual - confirmados + concluídos)
    const monthResult = await sql`
      SELECT COALESCE(SUM(total_price), 0) as total 
      FROM appointments 
      WHERE tenant_id = ${tenantId} 
      AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
      AND status IN ('confirmed', 'completed')
    `;

    // 4. EXPECTATIVA de faturamento hoje (pendentes + confirmados + concluídos)
    const expectedTodayResult = await sql`
      SELECT COALESCE(SUM(total_price), 0) as total 
      FROM appointments 
      WHERE tenant_id = ${tenantId} 
      AND date = CURRENT_DATE 
      AND status IN ('pending', 'confirmed', 'completed')
    `;

    // 5. EXPECTATIVA da SEMANA
    const expectedWeekResult = await sql`
      SELECT COALESCE(SUM(total_price), 0) as total 
      FROM appointments 
      WHERE tenant_id = ${tenantId} 
      AND date >= CURRENT_DATE 
      AND date <= CURRENT_DATE + INTERVAL '7 days'
      AND status IN ('pending', 'confirmed', 'completed')
    `;

    // 6. EXPECTATIVA do MÊS
    const expectedMonthResult = await sql`
      SELECT COALESCE(SUM(total_price), 0) as total 
      FROM appointments 
      WHERE tenant_id = ${tenantId} 
      AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
      AND status IN ('pending', 'confirmed', 'completed')
    `;

    // 7. Contagem de agendamentos pendentes e concluídos
    const pendingCount = await sql`
      SELECT COUNT(*) as count FROM appointments
      WHERE tenant_id = ${tenantId} AND status = 'pending'
    `;

    const completedCount = await sql`
      SELECT COUNT(*) as count FROM appointments
      WHERE tenant_id = ${tenantId} AND status = 'completed'
    `;

    return Response.json({
      success: true,
      data: {
        today: parseFloat(todayResult[0].total),
        thisWeek: parseFloat(weekResult[0].total),
        thisMonth: parseFloat(monthResult[0].total),
        expectedToday: parseFloat(expectedTodayResult[0].total),
        expectedWeek: parseFloat(expectedWeekResult[0].total),
        expectedMonth: parseFloat(expectedMonthResult[0].total),
        pendingCount: parseInt(pendingCount[0].count),
        completedCount: parseInt(completedCount[0].count),
      }
    });
  } catch (error) {
    console.error("Erro na API de faturamento:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
