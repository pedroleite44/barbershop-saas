import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, name, slug, phone, email, password } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID é obrigatório' }, { status: 400 });
    }

    // 1. Atualizar o Tenant
    await sql.query(
      `UPDATE tenants SET name = $1, slug = $2, phone = $3, email = $4, updated_at = NOW() WHERE id = $5`,
      [name, slug, phone, email, id]
    );

    // 2. Atualizar as Configurações (tenant_settings)
    await sql.query(
      `UPDATE tenant_settings SET name = $1, slug = $2, phone = $3, updated_at = NOW() WHERE tenant_id = $4`,
      [name, slug, phone, id]
    );

    // 3. Atualizar o Usuário Admin (se houver e-mail ou senha novos)
    if (email || password) {
      const updateFields = [];
      const values = [];
      let index = 1;

      if (email) {
        updateFields.push(`email = $${index++}`);
        values.push(email);
      }
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateFields.push(`password = $${index++}`);
        values.push(hashedPassword);
      }

      values.push(id);
      const userQuery = `UPDATE users SET ${updateFields.join(', ')}, updated_at = NOW() WHERE tenant_id = $${index} AND role = 'admin'`;
      await sql.query(userQuery, values);
    }

    return NextResponse.json({ success: true, message: 'Barbearia atualizada com sucesso!' });
  } catch (error) {
    console.error('Erro ao gerenciar tenant:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID é obrigatório' }, { status: 400 });
    }

    // Deletar em cascata (ordem correta para evitar erros de chave estrangeira)
    await sql`DELETE FROM appointments WHERE tenant_id = ${id}`;
    await sql`DELETE FROM barbers WHERE tenant_id = ${id}`;
    await sql`DELETE FROM services WHERE tenant_id = ${id}`;
    await sql`DELETE FROM users WHERE tenant_id = ${id}`;
    await sql`DELETE FROM tenant_settings WHERE tenant_id = ${id}`;
    await sql`DELETE FROM tenants WHERE id = ${id}`;

    return NextResponse.json({ success: true, message: 'Barbearia excluída com sucesso!' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
