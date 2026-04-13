import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tenant_id = searchParams.get('tenant_id');
  let barber_id = searchParams.get('barber_id');

  if (barber_id === 'undefined' || !barber_id || barber_id === 'null') barber_id = null;
  if (!tenant_id) return NextResponse.json({ success: false, error: 'Tenant ID obrigatório' }, { status: 400 });

  try {
    let appointments;
    if (barber_id) {
      appointments = await sql`
        SELECT a.id, a.client_name, a.date, a.time, a.status, a.phone, a.service_names,
               b.name as barber_name
        FROM appointments a
        LEFT JOIN barbers b ON a.barber_id = b.id
        WHERE a.tenant_id = ${tenant_id} AND a.barber_id = ${barber_id}
        ORDER BY a.date DESC, a.time DESC
      `;
    } else {
      appointments = await sql`
        SELECT a.id, a.client_name, a.date, a.time, a.status, a.phone, a.service_names,
               b.name as barber_name
        FROM appointments a
        LEFT JOIN barbers b ON a.barber_id = b.id
        WHERE a.tenant_id = ${tenant_id}
        ORDER BY a.date DESC, a.time DESC
      `;
    }

    // Agora usamos a coluna 'service_names' que já vem do banco
    const enrichedData = appointments.map(app => ({
      ...app,
      service_name: app.service_names || 'Serviço'
    }));

    return NextResponse.json({ success: true, data: enrichedData });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}