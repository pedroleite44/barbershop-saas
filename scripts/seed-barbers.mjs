import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

try {
  await sql`
    INSERT INTO barbers (tenant_id, name, created_at, updated_at)
    VALUES
      (1, 'João', NOW(), NOW()),
      (1, 'Carlos', NOW(), NOW()),
      (1, 'Pedro', NOW(), NOW())
  `;

  console.log("✅ Barbeiros criados");
} catch (error) {
  console.error(error.message);
}

process.exit(0);
