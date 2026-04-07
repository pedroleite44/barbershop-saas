import { sql } from '../../../lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');

    if (!tenantId) {
      return new Response(JSON.stringify({ error: 'tenant_id required' }), { status: 400 });
    }

    const services = await sql`
      SELECT * FROM services 
      WHERE tenant_id = ${parseInt(tenantId)} 
      ORDER BY id ASC
    `;

    return new Response(JSON.stringify({ success: true, data: services }), { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar serviços:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { tenant_id, name, description, price, emoji, duration } = await request.json();

    if (!tenant_id || !name) {
      return new Response(JSON.stringify({ error: 'tenant_id e name required' }), { status: 400 });
    }

    const result = await sql`
      INSERT INTO services (tenant_id, name, description, price, emoji, duration) 
      VALUES (${parseInt(tenant_id)}, ${name}, ${description || ''}, ${parseFloat(price) || 0}, ${emoji || ''}, ${parseInt(duration) || 30}) 
      RETURNING *
    `;

    return new Response(JSON.stringify({ success: true, data: result[0] }), { status: 201 });
  } catch (error) {
    console.error('Erro ao criar serviço:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { id, name, description, price, emoji, duration } = await request.json();

    if (!id) {
      return new Response(JSON.stringify({ error: 'id required' }), { status: 400 });
    }

    const result = await sql`
      UPDATE services 
      SET name = ${name}, description = ${description || ''}, price = ${parseFloat(price) || 0}, emoji = ${emoji || ''}, duration = ${parseInt(duration) || 30}, updated_at = NOW() 
      WHERE id = ${parseInt(id)} 
      RETURNING *
    `;

    return new Response(JSON.stringify({ success: true, data: result[0] }), { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'id required' }), { status: 400 });
    }

    await sql`DELETE FROM services WHERE id = ${parseInt(id)}`;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Erro ao deletar serviço:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}