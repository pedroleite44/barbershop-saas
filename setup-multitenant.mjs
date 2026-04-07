#!/usr/bin/env node

import { neon } from "@neondatabase/serverless";
import bcryptjs from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

const TENANTS = [
  {
    name: "Black Zone Barbearia",
    email: "blackzone@barbearia.com",
    phone: "(11) 98765-4321",
    city: "São Paulo",
    state: "SP",
  },
  {
    name: "Elite Barber Shop",
    email: "elite@barbearia.com",
    phone: "(11) 97654-3210",
    city: "São Paulo",
    state: "SP",
  },
];

const USERS = [
  {
    tenant_email: "blackzone@barbearia.com",
    name: "Admin Black Zone",
    email: "admin@blackzone.com",
    password: "admin123",
    phone: "(11) 99999-9999",
    role: "admin",
  },
  {
    tenant_email: "blackzone@barbearia.com",
    name: "Carioca",
    email: "carioca@blackzone.com",
    password: "barber123",
    phone: "(11) 98888-8888",
    role: "barber",
  },
  {
    tenant_email: "blackzone@barbearia.com",
    name: "Charles",
    email: "charles@blackzone.com",
    password: "barber123",
    phone: "(11) 97777-7777",
    role: "barber",
  },
  {
    tenant_email: "elite@barbearia.com",
    name: "Admin Elite",
    email: "admin@elite.com",
    password: "admin123",
    phone: "(11) 96666-6666",
    role: "admin",
  },
  {
    tenant_email: "elite@barbearia.com",
    name: "Barbeiro Elite 1",
    email: "barber1@elite.com",
    password: "barber123",
    phone: "(11) 95555-5555",
    role: "barber",
  },
];

async function setupDatabase() {
  try {
    console.log("🚀 Iniciando setup multi-tenant...\n");

    console.log("📋 Criando tabelas...");
    await sql`
      CREATE TABLE IF NOT EXISTS tenants (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        address VARCHAR(500),
        city VARCHAR(100),
        state VARCHAR(2),
        zip_code VARCHAR(10),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(20) DEFAULT 'barber',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        UNIQUE(tenant_id, email)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL,
        barber_id INTEGER NOT NULL,
        date DATE NOT NULL,
        time TIME NOT NULL,
        phone VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (barber_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(tenant_id, barber_id, date, time)
      )
    `;

    console.log("✅ Tabelas criadas com sucesso!\n");

    console.log("🏢 Inserindo tenants...");
    const insertedTenants = [];

    for (const tenant of TENANTS) {
      const result = await sql`
        INSERT INTO tenants (name, email, phone, city, state)
        VALUES (${tenant.name}, ${tenant.email}, ${tenant.phone}, ${tenant.city}, ${tenant.state})
        ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
        RETURNING id, name, email
      `;
      insertedTenants.push(result[0]);
      console.log(`  ✅ ${result[0].name} (ID: ${result[0].id})`);
    }
    console.log();

    console.log("👥 Inserindo usuários...");
    for (const user of USERS) {
      const tenant = insertedTenants.find((t) => t.email === user.tenant_email);
      if (!tenant) {
        console.log(`  ❌ Tenant não encontrado para ${user.email}`);
        continue;
      }

      const hashedPassword = await bcryptjs.hash(user.password, 10);

      const result = await sql`
        INSERT INTO users (tenant_id, name, email, password, phone, role)
        VALUES (${tenant.id}, ${user.name}, ${user.email}, ${hashedPassword}, ${user.phone}, ${user.role})
        ON CONFLICT (tenant_id, email) DO UPDATE SET updated_at = NOW()
        RETURNING id, email, role
      `;
      console.log(`  ✅ ${user.email} (${user.role}) - Tenant: ${tenant.name}`);
    }
    console.log();

    console.log("📊 Dados inseridos:\n");

    console.log("🏢 TENANTS:");
    const tenants = await sql`SELECT id, name, email FROM tenants`;
    tenants.forEach((t) => {
      console.log(`  [${t.id}] ${t.name} (${t.email})`);
    });
    console.log();

    console.log("👥 USUÁRIOS:");
    const users = await sql`
      SELECT u.id, u.tenant_id, u.name, u.email, u.role, t.name as tenant_name
      FROM users u
      JOIN tenants t ON u.tenant_id = t.id
      ORDER BY t.id, u.role DESC
    `;
    users.forEach((u) => {
      console.log(`  [${u.id}] ${u.email} (${u.role}) - ${u.tenant_name}`);
    });
    console.log();

    console.log("✅ Setup concluído com sucesso!\n");
    console.log("📝 CREDENCIAIS DE TESTE:\n");
    console.log("Black Zone Barbearia:");
    console.log("  Admin: admin@blackzone.com / admin123");
    console.log("  Barbeiro 1: carioca@blackzone.com / barber123");
    console.log("  Barbeiro 2: charles@blackzone.com / barber123\n");
    console.log("Elite Barber Shop:");
    console.log("  Admin: admin@elite.com / admin123");
    console.log("  Barbeiro: barber1@elite.com / barber123\n");

    console.log("🔐 IMPORTANTE: Cada usuário só vê dados da sua barbearia!");
    console.log("🔒 Dados estão completamente isolados por tenant.\n");
  } catch (error) {
    console.error("❌ ERRO:", error.message);
    process.exit(1);
  }
}

setupDatabase();
