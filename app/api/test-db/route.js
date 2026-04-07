import { initDatabase, sql } from "../../../lib/db.js";

export async function GET() {
  try {
    await initDatabase();
    console.log("\n--- 🔍 INICIANDO DIAGNÓSTICO DE BANCO ---");
    
    // 1. Teste de Inserção Simples
    try {
      const test = await sql`
        INSERT INTO appointments (tenant_id, barber_id, date, time, phone, client_name, status) 
        VALUES (1, 1, '2026-04-10', '10:00', '11999999999', 'Teste Simples', 'confirmed') 
        RETURNING id
      `;
      console.log("✅ SUCESSO: Inserção simples funcionou! ID:", test[0].id);
    } catch (e) {
      console.error("❌ ERRO na inserção simples:", e.message);
    }

    // 2. Teste de Inserção com Novos Campos
    try {
      const testFull = await sql`
        INSERT INTO appointments (tenant_id, barber_id, date, time, phone, client_name, status, service_names, total_price) 
        VALUES (1, 1, '2026-04-11', '11:00', '11999999999', 'Teste Completo', 'confirmed', 'Corte', 50.00) 
        RETURNING id
      `;
      console.log("✅ SUCESSO: Inserção completa (campos novos) funcionou! ID:", testFull[0].id);
    } catch (e) {
      console.error("❌ ERRO na inserção completa (campos novos):", e.message);
    }

    return Response.json({ 
      message: "Diagnóstico executado. Verifique o terminal do npm run dev.",
      hint: "Se aparecer erro de 'column does not exist', as colunas não foram criadas corretamente no banco."
    });
  } catch (error) {
    return Response.json({ error: error.message });
  }
}
