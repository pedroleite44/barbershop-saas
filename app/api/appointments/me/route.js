import { initDatabase, sql } from '../../../../lib/db.js';

export async function GET(req) {
  try {
    await initDatabase();
    
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenant_id') || 1;
    const barberId = searchParams.get('barber_id');

    if (!barberId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'barber_id é obrigatório' 
      }), { status: 400 });
    }

    const appointments = await sql`
      SELECT 
        id,
        tenant_id,
        barber_id,
        date,
        LEFT(CAST(time AS text), 5) AS time,
        phone,
        client_name,
        status,
        created_at
      FROM appointments 
      WHERE tenant_id = ${parseInt(tenantId)} 
      AND barber_id = ${parseInt(barberId)}
      ORDER BY date DESC, time DESC
    `;

    return new Response(JSON.stringify({ 
      success: true, 
      data: appointments || [] 
    }), { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar agendamentos do barbeiro:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await initDatabase();
    
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenant_id') || 1;
    const appointmentId = searchParams.get('id');

    if (!appointmentId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'id é obrigatório' 
      }), { status: 400 });
    }

    await sql`
      DELETE FROM appointments
      WHERE id = ${parseInt(appointmentId)}
      AND tenant_id = ${parseInt(tenantId)}
    `;

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Agendamento deletado com sucesso'
    }), { status: 200 });
  } catch (error) {
    console.error('Erro ao deletar agendamento:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { status: 500 });
  }
}
