import { sql, initDatabase } from '../../../lib/db.js';

export async function GET(req) {
  try {
    await initDatabase();
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenant_id') || 1;

    const barbers = await sql`
      SELECT * FROM barbers 
      WHERE tenant_id = ${parseInt(tenantId)}
      ORDER BY name ASC
    `;

    return Response.json({ 
      success: true, 
      data: barbers 
    });
  } catch (error) {
    console.error('Erro ao buscar barbeiros:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await initDatabase();
    const body = await req.json();
    
    // CORREÇÃO: Adicionado photo_url no recebimento do body
    const { tenant_id, name, phone, specialty, photo_url, commission_percentage } = body;

    if (!tenant_id || !name) {
      return Response.json({ success: false, error: 'tenant_id e name são obrigatórios' }, { status: 400 });
    }

    // CORREÇÃO: Adicionado photo_url no comando INSERT
    const result = await sql`
      INSERT INTO barbers (tenant_id, name, phone, specialty, photo_url, commission_percentage)
      VALUES (
        ${parseInt(tenant_id)}, 
        ${name}, 
        ${phone || ''}, 
        ${specialty || ''}, 
        ${photo_url || ''}, 
        ${parseFloat(commission_percentage) || 0}
      )
      RETURNING *
    `;

    return Response.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Erro ao criar barbeiro:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await initDatabase();
    const body = await req.json();
    
    // CORREÇÃO: Adicionado photo_url no recebimento do body
    const { id, name, phone, specialty, photo_url, commission_percentage } = body;

    if (!id) {
      return Response.json({ success: false, error: 'id é obrigatório' }, { status: 400 });
    }

    // CORREÇÃO: Adicionado photo_url no comando UPDATE
    const result = await sql`
      UPDATE barbers
      SET 
        name = ${name}, 
        phone = ${phone || ''}, 
        specialty = ${specialty || ''}, 
        photo_url = ${photo_url || ''}, 
        commission_percentage = ${parseFloat(commission_percentage) || 0},
        updated_at = NOW()
      WHERE id = ${parseInt(id)}
      RETURNING *
    `;

    return Response.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Erro ao atualizar barbeiro:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await initDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ success: false, error: 'id é obrigatório' }, { status: 400 });
    }

    await sql`DELETE FROM barbers WHERE id = ${parseInt(id)}`;

    return Response.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar barbeiro:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}