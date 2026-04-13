import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Buscamos os dados da tabela tenant_settings e fazemos um JOIN com a tabela tenants para pegar o e-mail
    const tenants = await sql`
      SELECT ts.id, ts.name, ts.slug, ts.phone, t.email, ts.created_at 
      FROM tenant_settings ts
      LEFT JOIN tenants t ON ts.tenant_id = t.id
      ORDER BY ts.id DESC
    `;

    return NextResponse.json({ success: true, data: tenants }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}