import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function fix() {
  try {
    console.log("🛠️ Verificando e corrigindo colunas de SLUG...");
    
    // 1. Tentar adicionar na tabela tenants (se existir)
    try {
      await sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE`;
      console.log("✅ Coluna slug garantida na tabela 'tenants'.");
    } catch (e) {
      console.log("ℹ️ Tabela 'tenants' não encontrada ou erro ao alterar.");
    }

    // 2. Tentar adicionar na tabela tenant_settings (ESSA É A MAIS IMPORTANTE)
    try {
      await sql`ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE`;
      console.log("✅ Coluna slug garantida na tabela 'tenant_settings'.");
    } catch (e) {
      console.error("❌ Erro ao alterar tenant_settings:", e.message);
    }

    // 3. Preencher slugs para quem está vazio
    await sql`UPDATE tenant_settings SET slug = LOWER(REPLACE(name, ' ', '-')) WHERE slug IS NULL`;
    console.log("✅ Slugs preenchidos para registros existentes!");

  } catch (e) {
    console.error("❌ Erro crítico no banco:", e.message);
  }
}
fix();