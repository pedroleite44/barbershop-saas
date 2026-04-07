import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function resetDatabase() {
  try {
    console.log("🗑️  Deletando tabelas antigas...");
    
    // Dropar tabelas em ordem (por causa das foreign keys)
    await sql`DROP TABLE IF EXISTS appointments CASCADE`;
    await sql`DROP TABLE IF EXISTS users CASCADE`;
    await sql`DROP TABLE IF EXISTS tenants CASCADE`;
    
    console.log("✅ Tabelas deletadas!\n");
    console.log("Agora execute: node setup-multitenant.mjs");
  } catch (error) {
    console.error("❌ ERRO:", error.message);
    process.exit(1);
  }
}

resetDatabase();
