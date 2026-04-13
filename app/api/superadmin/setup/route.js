import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, slug, phone, email, password } = body;

    if (!name || !slug || !email) {
      return NextResponse.json({ success: false, error: 'Nome, Slug e E-mail são obrigatórios' }, { status: 400 });
    }

    // 1. Criar o Tenant principal
    const tenantResult = await sql`
      INSERT INTO tenants (name, email, phone, slug, created_at, updated_at)
      VALUES (${name}, ${email}, ${phone}, ${slug}, NOW(), NOW())
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
      RETURNING id
    `;

    const tenantId = tenantResult[0].id;

    // 2. Criar as Configurações (tenant_settings) vinculadas ao tenant_id
    await sql`
      INSERT INTO tenant_settings (tenant_id, name, slug, phone, primary_color, secondary_color, accent_color, created_at, updated_at)
      VALUES (${tenantId}, ${name}, ${slug}, ${phone}, '#ff0000', '#000000', '#ffffff', NOW(), NOW())
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    `;

    // 3. Criar o Usuário Admin
    const hashedPassword = await bcrypt.hash(password || '123456', 10);
    await sql`
      INSERT INTO users (name, email, password, role, tenant_id, created_at, updated_at)
      VALUES (${name + ' Admin'}, ${email}, ${hashedPassword}, 'admin', ${tenantId}, NOW(), NOW())
      ON CONFLICT (tenant_id, email) DO UPDATE SET 
        name = EXCLUDED.name, 
        password = EXCLUDED.password,
        updated_at = NOW()
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Barbearia configurada com sucesso!',
      tenantId 
    });

  } catch (error) {
    console.error('Erro no Setup:', error);
    let errorMessage = error.message;
    if (errorMessage.includes('tenants_slug_key')) errorMessage = 'Este link (slug) já está em uso.';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
