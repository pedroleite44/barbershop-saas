import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

// ✅ FORÇA A ROTA A SER SEMPRE DINÂMICA (IGNORA CACHE DA VERCEL)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Buscamos os dados diretamente da tabela principal de tenants para garantir que nada falhe
    // Fazemos um LEFT JOIN com tenant_settings para pegar o nome da barbearia se disponível
    const tenants = await sql`
      SELECT 
        t.id, 
        COALESCE(ts.name, t.name) as name, 
        t.slug, 
        t.phone, 
        t.email, 
        t.created_at 
      FROM tenants t
      LEFT JOIN tenant_settings ts ON t.id = ts.tenant_id
      ORDER BY t.id DESC
    `;

    return NextResponse.json({ success: true, data: tenants }, {
      headers: { 
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('ERRO LIST TENANTS:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}