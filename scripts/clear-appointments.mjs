import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function clear() {
  try {
    console.log("🧹 Limpando agendamentos para teste...");
    await sql`DELETE FROM appointments`;
    console.log("✅ Banco de agendamentos limpo com sucesso!");
  } catch (e) {
    console.error("❌ Erro ao limpar:", e.message);
  }
}
clear();