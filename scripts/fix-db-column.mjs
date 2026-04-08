import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

// Carregar variáveis do arquivo .env
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("❌ Erro: DATABASE_URL não encontrada no arquivo .env");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function fix() {
  try {
    console.log("🛠️ Conectando ao banco e corrigindo tabela barbers...");
    await sql`ALTER TABLE barbers ADD COLUMN IF NOT EXISTS user_id INT UNIQUE`;
    console.log("✅ Coluna user_id adicionada com sucesso!");
  } catch (e) {
    console.error("❌ Erro ao corrigir:", e.message);
  }
}
fix();