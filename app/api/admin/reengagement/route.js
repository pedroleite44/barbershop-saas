import { initDatabase, sql } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');
    const daysInactive = parseInt(searchParams.get('days')) || 15;

    if (!tenantId) {
      return Response.json({ success: false, error: 'tenant_id é obrigatório' }, { status: 400 });
    }

    const db = await initDatabase();

    // Query para encontrar clientes inativos
    // Busca clientes que tiveram agendamentos completados há mais de X dias
    // E não possuem agendamentos futuros
    const query = `
      WITH last_appointments AS (
        SELECT 
          client_name,
          phone,
          MAX(date) as last_date,
          MAX(created_at) as last_created_at
        FROM appointments
        WHERE tenant_id = $1
          AND date < CURRENT_DATE
          AND status = 'confirmed'
        GROUP BY client_name, phone
      ),
      future_appointments AS (
        SELECT DISTINCT phone
        FROM appointments
        WHERE tenant_id = $1
          AND date >= CURRENT_DATE
          AND status = 'confirmed'
      )
      SELECT 
        la.client_name,
        la.phone,
        la.last_date,
        la.last_created_at,
        EXTRACT(DAY FROM CURRENT_DATE - la.last_date) as days_inactive
      FROM last_appointments la
      WHERE EXTRACT(DAY FROM CURRENT_DATE - la.last_date) >= $2
        AND la.phone NOT IN (SELECT phone FROM future_appointments)
      ORDER BY la.last_date DESC
    `;

    const result = await db.query(query, [tenantId, daysInactive]);

    return Response.json({
      success: true,
      data: result.rows || [],
      count: result.rows?.length || 0,
    });

  } catch (error) {
    console.error('Erro ao buscar clientes inativos:', error);
    return Response.json(
      { success: false, error: error.message || 'Erro ao buscar clientes inativos' },
      { status: 500 }
    );
  }
}