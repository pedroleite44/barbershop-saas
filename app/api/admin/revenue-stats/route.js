import { initDatabase, sql } from "../../../../lib/db.js";

export async function GET(request) {
  try {
    await initDatabase();
    
    const { searchParams } = new URL(request.url);
    const tenantId = Number(searchParams.get("tenant_id") || 1);

    // 1. Faturamento de HOJE
    const todayResult = await sql`
      SELECT COALESCE(SUM(total_price), 0) as total 
      FROM appointments 
      WHERE tenant_id = ${tenantId} 
      AND date = CURRENT_DATE 
      AND status = 'confirmed'
    `;

    // 2. Faturamento da SEMANA (Últimos 7 dias)
    const weekResult = await sql`
      SELECT COALESCE(SUM(total_price), 0) as total 
      FROM appointments 
      WHERE tenant_id = ${tenantId} 
      AND date >= CURRENT_DATE - INTERVAL '7 days' 
      AND status = 'confirmed'
    `;

    // 3. Faturamento do MÊS (Mês atual)
    const monthResult = await sql`
      SELECT COALESCE(SUM(total_price), 0) as total 
      FROM appointments 
      WHERE tenant_id = ${tenantId} 
      AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
      AND status = 'confirmed'
    `;

    return Response.json({
      success: true,
      data: {
        today: parseFloat(todayResult[0].total),
        thisWeek: parseFloat(weekResult[0].total),
        thisMonth: parseFloat(monthResult[0].total)
      }
    });
  } catch (error) {
    console.error("Erro na API de faturamento:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}