import { sql, initDatabase } from '../../../lib/db.js';
import bcrypt from 'bcryptjs';

export async function GET(req) {
  try {
    await initDatabase();
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenant_id') || 1;

    // ✅ ATUALIZADO: JOIN com a tabela users para trazer o email
    const barbers = await sql`
      SELECT b.*, u.email 
      FROM barbers b
      LEFT JOIN users u ON b.user_id = u.id
      WHERE b.tenant_id = ${parseInt(tenantId)}
      ORDER BY b.name ASC
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
    
    const { tenant_id, name, phone, email, password, specialty, photo_url, commission_percentage } = body;

    if (!tenant_id || !name || !email || !password) {
      return Response.json({ 
        success: false, 
        error: 'tenant_id, name, email e password são obrigatórios' 
      }, { status: 400 });
    }

    if (password.length < 6) {
      return Response.json({ 
        success: false, 
        error: 'A senha deve ter no mínimo 6 caracteres' 
      }, { status: 400 });
    }

    // Verificar se o email já existe
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser.length > 0) {
      return Response.json({ 
        success: false, 
        error: 'Este email já está cadastrado' 
      }, { status: 400 });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário com role 'barber'
    // Removido created_at e updated_at para deixar o banco gerenciar automaticamente conforme seu original
    const userResult = await sql`
      INSERT INTO users (name, email, password, role, tenant_id)
      VALUES (${name}, ${email}, ${hashedPassword}, 'barber', ${parseInt(tenant_id)})
      RETURNING id
    `;

    const userId = userResult[0].id;

    // Criar barbeiro vinculado ao usuário
    const result = await sql`
      INSERT INTO barbers (tenant_id, user_id, name, phone, specialty, photo_url, commission_percentage)
      VALUES (
        ${parseInt(tenant_id)}, 
        ${userId},
        ${name}, 
        ${phone || ''}, 
        ${specialty || ''}, 
        ${photo_url || ''}, 
        ${parseFloat(commission_percentage) || 0}
      )
      RETURNING *
    `;

    return Response.json({ 
      success: true, 
      data: result[0],
      message: `Barbeiro criado com sucesso! Email: ${email}`
    });
  } catch (error) {
    console.error('Erro ao criar barbeiro:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await initDatabase();
    const body = await req.json();
    
    // ✅ ATUALIZADO: Recebe email e password para edição conforme sua nova necessidade
    const { id, name, phone, email, password, specialty, photo_url, commission_percentage } = body;

    if (!id) {
      return Response.json({ success: false, error: 'id é obrigatório' }, { status: 400 });
    }

    // 1. Buscar o user_id vinculado a este barbeiro
    const barberCheck = await sql`SELECT user_id FROM barbers WHERE id = ${parseInt(id)}`;
    if (barberCheck.length === 0) {
      return Response.json({ success: false, error: 'Barbeiro não encontrado' }, { status: 404 });
    }
    const userId = barberCheck[0].user_id;

    // 2. Se o email foi enviado, verificar se já pertence a outro usuário
    if (email) {
      const existingUser = await sql`
        SELECT id FROM users WHERE email = ${email} AND id != ${userId}
      `;
      if (existingUser.length > 0) {
        return Response.json({ success: false, error: 'Este email já está em uso por outro usuário' }, { status: 400 });
      }
      
      // Atualizar email e nome na tabela users
      await sql`
        UPDATE users 
        SET email = ${email}, name = ${name} 
        WHERE id = ${userId}
      `;
    }

    // 3. Se uma nova senha foi enviada, atualizar com hash
    if (password && password.trim() !== '') {
      if (password.length < 6) {
        return Response.json({ success: false, error: 'A nova senha deve ter no mínimo 6 caracteres' }, { status: 400 });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      await sql`UPDATE users SET password = ${hashedPassword} WHERE id = ${userId}`;
    }

    // 4. Atualizar os dados na tabela barbers
    // Removido updated_at conforme seu original
    const result = await sql`
      UPDATE barbers
      SET 
        name = ${name}, 
        phone = ${phone || ''}, 
        specialty = ${specialty || ''}, 
        photo_url = ${photo_url || ''}, 
        commission_percentage = ${parseFloat(commission_percentage) || 0}
      WHERE id = ${parseInt(id)}
      RETURNING *
    `;

    return Response.json({ 
      success: true, 
      data: result[0],
      message: 'Barbeiro atualizado com sucesso!'
    });
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

    // Buscar o barbeiro para obter o user_id
    const barber = await sql`SELECT user_id FROM barbers WHERE id = ${parseInt(id)}`;
    
    if (barber.length > 0 && barber[0].user_id) {
      // Deletar o usuário associado
      await sql`DELETE FROM users WHERE id = ${barber[0].user_id}`;
    }

    // Deletar o barbeiro
    await sql`DELETE FROM barbers WHERE id = ${parseInt(id)}`;

    return Response.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar barbeiro:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}