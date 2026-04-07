import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

try {
  const result = await sql`
    SELECT whatsapp FROM tenant_settings LIMIT 1
  `;

  console.log("RESULTADO:", result);
} catch (error) {
  console.error("ERRO:", error.message);
}

process.exit(0);
