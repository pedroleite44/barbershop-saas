import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 1. BUSCAR SERVIÇOS (GET)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');

    if (!tenant_id) {
      return NextResponse.json({ success: false, error: 'tenant_id é obrigatório' }, { status: 400 });
    }

    const services = await sql`
      SELECT * FROM services 
      WHERE tenant_id = ${parseInt(tenant_id)} 
      ORDER BY name ASC
    `;

    return NextResponse.json({ success: true, data: services });
  } catch (error) {
    console.error('Erro ao buscar serviços:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 2. CRIAR NOVO SERVIÇO (POST)
export async function POST(request) {
  try {
    const body = await request.json();
    const { tenant_id, name, description, price, duration, emoji, icon, category } = body;

    if (!tenant_id || !name) {
      return NextResponse.json({ success: false, error: 'Nome e tenant_id são obrigatórios' }, { status: 400 });
    }

    // Garantindo valores seguros para colunas NOT NULL
    const safePrice = parseFloat(price) || 0;
    const safeDuration = parseInt(duration) || 30;
    const safeEmoji = emoji || icon || '✂️';

    // REMOVIDO 'updated_at' pois a coluna não existe no seu banco
    const result = await sql`
      INSERT INTO services (
        tenant_id, 
        name, 
        description, 
        price, 
        duration, 
        emoji, 
        category,
        created_at
      )
      VALUES (
        ${parseInt(tenant_id)}, 
        ${name}, 
        ${description || ''}, 
        ${safePrice}, 
        ${safeDuration}, 
        ${safeEmoji}, 
        ${category || 'Geral'},
        NOW()
      )
      RETURNING id
    `;

    return NextResponse.json({ success: true, id: result[0].id });
  } catch (error) {
    console.error('Erro detalhado ao criar serviço:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro no banco Neon (Coluna inexistente?): ' + error.message 
    }, { status: 500 });
  }
}

// 3. ATUALIZAR SERVIÇO (PUT)
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, name, description, price, duration, emoji, icon, category } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID do serviço é obrigatório' }, { status: 400 });
    }

    const safePrice = parseFloat(price) || 0;
    const safeDuration = parseInt(duration) || 30;
    const safeEmoji = emoji || icon || '✂️';

    // REMOVIDO 'updated_at' aqui também
    await sql`
      UPDATE services 
      SET 
        name = ${name}, 
        description = ${description || ''}, 
        price = ${safePrice}, 
        duration = ${safeDuration}, 
        emoji = ${safeEmoji},
        category = ${category || 'Geral'}
      WHERE id = ${parseInt(id)}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 4. DELETAR SERVIÇO (DELETE)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID é obrigatório' }, { status: 400 });
    }

    await sql`DELETE FROM services WHERE id = ${parseInt(id)}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar serviço:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
