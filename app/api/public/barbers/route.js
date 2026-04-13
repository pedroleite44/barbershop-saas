import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');

    // Se não houver tenant_id, retornamos erro para evitar misturar dados
    if (!tenant_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'O identificador da barbearia (tenant_id) é obrigatório.' 
      }, { status: 400 });
    }

    // FILTRO ADICIONADO: Agora buscamos apenas os barbeiros daquela barbearia específica
    const barbers = await sql`
      SELECT id, name, specialty, photo_url, bio, is_active 
      FROM barbers 
      WHERE tenant_id = ${tenant_id} 
      AND is_active = true
      ORDER BY name ASC
    `;

    return NextResponse.json({ 
      success: true, 
      data: barbers 
    });

  } catch (error) {
    console.error('Erro ao buscar barbeiros:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno ao buscar lista de barbeiros.' 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, specialty, photo_url, bio, tenant_id } = body;

    if (!name || !tenant_id) {
      return NextResponse.json({ success: false, error: 'Nome e tenant_id são obrigatórios' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO barbers (name, specialty, photo_url, bio, tenant_id, is_active, created_at, updated_at)
      VALUES (${name}, ${specialty}, ${photo_url}, ${bio}, ${tenant_id}, true, NOW(), NOW())
      RETURNING id
    `;

    return NextResponse.json({ success: true, id: result[0].id });
  } catch (error) {
    console.error('Erro ao criar barbeiro:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
