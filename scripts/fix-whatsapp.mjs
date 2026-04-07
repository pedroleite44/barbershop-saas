import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

try {
  await sql`
    ALTER TABLE tenant_settings 
    ADD COLUMN IF NOT EXISTS whatsapp TEXT
  `;

  console.log("✅ coluna whatsapp criada com sucesso");
} catch (error) {
  console.error("❌ erro:", error.message);
}

process.exit(0);
