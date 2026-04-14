import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const auth = getAuthFromRequest(request);
  
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
  }

  const { id: userId, tenant_id: tenantId, role } = auth;

  try {
    let appointments;

    if (role === 'barber') {
      // Busca o ID do barbeiro vinculado ao usuário logado
      const barberRecord = await sql`
        SELECT id FROM barbers WHERE user_id = ${userId} AND tenant_id = ${tenantId}
      `;

      if (barberRecord.length === 0) {
        return NextResponse.json({ success: true, data: [] });
      }

      const barberId = barberRecord[0].id;

      appointments = await sql`
        SELECT a.id, a.client_name, a.date, a.time, a.status, a.phone, a.service_names,
               b.name as barber_name
        FROM appointments a
        LEFT JOIN barbers b ON a.barber_id = b.id
        WHERE a.tenant_id = ${tenantId} AND a.barber_id = ${barberId}
        ORDER BY a.date DESC, a.time DESC
      `;
    } else if (role === 'admin') {
      // Admin continua vendo todos da barbearia
      appointments = await sql`
        SELECT a.id, a.client_name, a.date, a.time, a.status, a.phone, a.service_names,
               b.name as barber_name
        FROM appointments a
        LEFT JOIN barbers b ON a.barber_id = b.id
        WHERE a.tenant_id = ${tenantId}
        ORDER BY a.date DESC, a.time DESC
      `;
    } else {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
    }

    const enrichedData = appointments.map(app => ({
      ...app,
      service_name: app.service_names || 'Serviço'
    }));

    return NextResponse.json({ success: true, data: enrichedData });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const auth = getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const appointmentId = searchParams.get('id');
  const { id: userId, tenant_id: tenantId, role } = auth;

  try {
    if (role === 'barber') {
      const barberRecord = await sql`SELECT id FROM barbers WHERE user_id = ${userId}`;
      const barberId = barberRecord[0]?.id;

      const result = await sql`
        DELETE FROM appointments 
        WHERE id = ${appointmentId} AND barber_id = ${barberId} AND tenant_id = ${tenantId}
        RETURNING id
      `;
      if (result.length === 0) throw new Error('Não permitido');
    } else {
      await sql`DELETE FROM appointments WHERE id = ${appointmentId} AND tenant_id = ${tenantId}`;
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
