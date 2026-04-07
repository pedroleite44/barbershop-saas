import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";

const sql = neon(process.env.DATABASE_URL);

export async function POST(req) {
  try {
    // Ler arquivo SQL
    const sqlFile = path.join(process.cwd(), "migrations", "add_subdomain.sql");
    const sqlContent = fs.readFileSync(sqlFile, "utf-8");

    // Executar cada comando SQL
    const commands = sqlContent
      .split(";")
      .map((cmd) => cmd.trim())
      .filter((cmd) => cmd && !cmd.startsWith("--"));

    for (const command of commands) {
      console.log("Executando:", command);
      await sql.query(command);
    }

    return Response.json({
      success: true,
      message: "Migrations executadas com sucesso!",
    });
  } catch (error) {
    console.error("ERRO MIGRATION:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  return Response.json({
    message: "POST para executar migrations",
  });
}
