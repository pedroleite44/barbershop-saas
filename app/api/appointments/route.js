import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tenant_id = searchParams.get('tenant_id');
  const barber_id = searchParams.get('barber_id');

  if (!tenant_id) {
    return NextResponse.json({ success: false, error: 'Tenant ID não fornecido' }, { status: 400 });
  }

  try {
    let appointments;
    const tId = parseInt(tenant_id);
    
    // Query base que traz todos os campos necessários, tratando possíveis nomes de colunas diferentes
    const query = (whereClause) => sql`
      SELECT 
        a.id, 
        a.client_name, 
        a.date, 
        a.time, 
        a.status, 
        a.phone,
        COALESCE(a.service_names, a.service_ids) as service_names,
        a.total_price,
        b.name as barber_name
      FROM appointments a
      LEFT JOIN barbers b ON a.barber_id = b.id
      WHERE ${whereClause}
      ORDER BY a.date DESC, a.time DESC
    `;

    if (barber_id && barber_id !== 'undefined' && barber_id !== 'null') {
      const bId = parseInt(barber_id);
      appointments = await sql`
        SELECT a.*, b.name as barber_name 
        FROM appointments a
        LEFT JOIN barbers b ON a.barber_id = b.id
        WHERE a.tenant_id = ${tId} AND a.barber_id = ${bId}
        ORDER BY a.date DESC, a.time DESC
      `;
    } else {
      appointments = await sql`
        SELECT a.*, b.name as barber_name 
        FROM appointments a
        LEFT JOIN barbers b ON a.barber_id = b.id
        WHERE a.tenant_id = ${tId}
        ORDER BY a.date DESC, a.time DESC
      `;
    }

    // Mapeamento para garantir que o frontend receba os nomes de campos esperados
    const mappedAppointments = appointments.map(apt => ({
      ...apt,
      // Garante que service_names exista mesmo que venha service_name do banco
      service_names: apt.service_names || apt.service_name || '-',
      // Garante que barber_name exista
      barber_name: apt.barber_name || 'Não atribuído'
    }));

    return NextResponse.json({ success: true, data: mappedAppointments });
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    return NextResponse.json({ success: false, error: 'Erro no banco de dados: ' + error.message }, { status: 500 });
  }
}