import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const auth = getAuthFromRequest(request);
  
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
  }

  const { id: userId, tenant_id: userTenantId, role } = auth;
  const { searchParams } = new URL(request.url);
  const tenant_id = searchParams.get('tenant_id');
  const barber_id = searchParams.get('barber_id');

  const tId = parseInt(tenant_id || userTenantId);
  if (tId !== parseInt(userTenantId)) {
    return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
  }

  try {
    let appointments;
    
    if (role === 'barber') {
      // Força o filtro pelo ID do barbeiro logado, ignorando o que vier na URL
      const barberRecord = await sql`SELECT id FROM barbers WHERE user_id = ${userId}`;
      const bId = barberRecord[0]?.id;
      
      appointments = await sql`
        SELECT a.id, a.client_name, a.date, a.time, a.status, a.phone,
               a.service_names as service_name, b.name as barber_name
        FROM appointments a
        LEFT JOIN barbers b ON a.barber_id = b.id
        WHERE a.tenant_id = ${tId} AND a.barber_id = ${bId}
        ORDER BY a.date DESC, a.time DESC
      `;
    } else {
      // Admin pode ver todos ou filtrar por um barbeiro específico
      const bFilter = barber_id && barber_id !== 'null' ? barber_id : null;
      appointments = await sql`
        SELECT a.id, a.client_name, a.date, a.time, a.status, a.phone,
               a.service_names as service_name, b.name as barber_name
        FROM appointments a
        LEFT JOIN barbers b ON a.barber_id = b.id
        WHERE a.tenant_id = ${tId} ${bFilter ? sql`AND a.barber_id = ${bFilter}` : sql``}
        ORDER BY a.date DESC, a.time DESC
      `;
    }

    return NextResponse.json({ success: true, data: appointments });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
