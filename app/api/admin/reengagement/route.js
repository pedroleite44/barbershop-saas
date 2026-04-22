import { initDatabase, sql } from '@/lib/db';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

// 1. BUSCAR CLIENTES INATIVOS (HÁ 15 DIAS OU MAIS)
export async function GET(request) {
  try {
    await initDatabase();
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');
    const daysInactive = parseInt(searchParams.get('days')) || 15;

    if (!tenantId) {
      return Response.json({ success: false, error: 'tenant_id é obrigatório' }, { status: 400 });
    }

    const tId = parseInt(tenantId);

    // Query corrigida para Neon/PostgreSQL
    const inactiveClients = await sql`
      WITH last_appointments AS (
        SELECT 
          client_name,
          phone,
          MAX(date::date) as last_date
        FROM appointments
        WHERE tenant_id = ${tId}
          AND date::date < CURRENT_DATE
        GROUP BY client_name, phone
      ),
      future_appointments AS (
        SELECT DISTINCT phone
        FROM appointments
        WHERE tenant_id = ${tId} AND date::date >= CURRENT_DATE
      )
      SELECT 
        la.client_name,
        la.phone,
        la.last_date,
        (CURRENT_DATE - la.last_date) as days_inactive
      FROM last_appointments la
      WHERE (CURRENT_DATE - la.last_date) >= ${daysInactive}
        AND la.phone NOT IN (SELECT phone FROM future_appointments)
      ORDER BY la.last_date DESC
    `;

    return Response.json({
      success: true,
      data: inactiveClients || [],
      count: inactiveClients?.length || 0,
    });

  } catch (error) {
    console.error('Erro ao buscar clientes inativos:', error);
    return Response.json(
      { success: false, error: error.message || 'Erro ao buscar clientes inativos' },
      { status: 500 }
    );
  }
}

// 2. DISPARAR MENSAGENS PARA A LISTA
export async function POST(request) {
  try {
    await initDatabase();
    const body = await request.json();
    const { tenant_id, clients, messageTemplate } = body;

    if (!tenant_id || !clients || !Array.isArray(clients)) {
      return Response.json({ success: false, error: 'Dados inválidos' }, { status: 400 });
    }

    const results = [];
    for (const client of clients) {
      // Personaliza a mensagem com o nome do cliente
      const message = messageTemplate
        ? messageTemplate.replace('{nome}', client.client_name)
        : `Olá ${client.client_name}, faz um tempo que não nos vemos! Que tal agendar um novo horário?`;

      const response = await sendWhatsAppMessage(client.phone, message);
      results.push({ phone: client.phone, success: response.success });
    }

    return Response.json({ success: true, results });
  } catch (error) {
    console.error('Erro ao enviar mensagens de reengajamento:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
