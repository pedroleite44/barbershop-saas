import { initDatabase } from "../lib/db.js";

try {
  await initDatabase();
  console.log("✅ Banco ajustado com sucesso");
  process.exit(0);
} catch (error) {
  console.error("❌ Falha ao ajustar o banco:", error);
  process.exit(1);
}
