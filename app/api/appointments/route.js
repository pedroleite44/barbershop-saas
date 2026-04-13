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
    
    if (barber_id && barber_id !== 'undefined' && barber_id !== 'null') {
      const bId = parseInt(barber_id);
      // Se for um barbeiro logado, vê apenas os DELE
      appointments = await sql`
        SELECT a.id, a.client_name, a.date, a.time, a.status, a.phone,
               a.service_names as service_name, a.total_price as service_price,
               b.name as barber_name
        FROM appointments a
        LEFT JOIN barbers b ON a.barber_id = b.id
        WHERE a.tenant_id = ${tId} AND a.barber_id = ${bId}
        ORDER BY a.date DESC, a.time DESC
      `;
    } else {
      // Se for o Admin, vê TODOS da barbearia
      appointments = await sql`
        SELECT a.id, a.client_name, a.date, a.time, a.status, a.phone,
               a.service_names as service_name, a.total_price as service_price,
               b.name as barber_name
        FROM appointments a
        LEFT JOIN barbers b ON a.barber_id = b.id
        WHERE a.tenant_id = ${tId}
        ORDER BY a.date DESC, a.time DESC
      `;
    }

    return NextResponse.json({ success: true, data: appointments });
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    return NextResponse.json({ success: false, error: 'Erro no banco de dados: ' + error.message }, { status: 500 });
  }
}
