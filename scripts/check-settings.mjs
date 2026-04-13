import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function checkSettings() {
  try {
    console.log("🔍 Verificando configurações no banco de dados...\n");
    
    const result = await sql`
      SELECT id, name, phone, opening_time, closing_time, appointment_interval, primary_color 
      FROM tenant_settings 
      LIMIT 5
    `;
    
    console.log("📋 Dados encontrados:\n");
    result.forEach(row => {
      console.log(`ID: ${row.id}`);
      console.log(`Nome: ${row.name}`);
      console.log(`Telefone: ${row.phone}`);
      console.log(`Abertura: ${row.opening_time}`);
      console.log(`Fechamento: ${row.closing_time}`);
      console.log(`Intervalo: ${row.appointment_interval}`);
      console.log(`Cor Primária: ${row.primary_color}`);
      console.log("---");
    });
    
    if (result.length === 0) {
      console.log("⚠️ Nenhuma configuração encontrada no banco!");
    }
  } catch (e) {
    console.error("❌ Erro ao verificar:", e.message);
  }
}

checkSettings();