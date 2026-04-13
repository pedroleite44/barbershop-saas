import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function update() {
  try {
    console.log("🛠️ Atualizando banco de dados...");
    
    // Tentar adicionar a coluna slug na tabela tenants (ou tenant_settings se tenants não existir)
    try {
      await sql`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE`;
      console.log("✅ Coluna slug adicionada na tabela tenants!");
    } catch (e) {
      console.log("⚠️ Tabela tenants não encontrada, tentando em tenant_settings...");
      await sql`ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE`;
      console.log("✅ Coluna slug adicionada na tabela tenant_settings!");
    }

    // Preencher slugs iniciais para quem não tem
    await sql`UPDATE tenant_settings SET slug = LOWER(REPLACE(name, ' ', '-')) WHERE slug IS NULL`;
    console.log("✅ Slugs iniciais preenchidos!");

  } catch (e) {
    console.error("❌ Erro ao atualizar banco:", e.message);
  }
}
update();