import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sql = neon(process.env.DATABASE_URL);

async function runMigrations() {
  try {
    console.log("?? Iniciando migrations...");

    // Ler arquivo SQL
    const sqlFile = path.join(__dirname, "..", "migrations", "add_subdomain.sql");
    const sqlContent = fs.readFileSync(sqlFile, "utf-8");

    // Executar cada comando SQL
    const commands = sqlContent
      .split(";")
      .map((cmd) => cmd.trim())
      .filter((cmd) => cmd && !cmd.startsWith("--"));

    for (const command of commands) {
      console.log("? Executando:", command.substring(0, 50) + "...");
      await sql.query(command);
    }

    console.log("? Migrations executadas com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("? ERRO:", error.message);
    process.exit(1);
  }
}

runMigrations();
