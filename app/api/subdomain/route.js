import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const subdomain = searchParams.get("subdomain");

    if (!subdomain) {
      return Response.json({ error: "Subdomain é obrigatório" }, { status: 400 });
    }

    // Buscar tenant pelo subdomain
    const tenant = await sql`
      SELECT id, name, subdomain
      FROM tenants
      WHERE subdomain = ${subdomain}
      LIMIT 1
    `;

    if (tenant.length === 0) {
      return Response.json({ error: "Barbearia não encontrada" }, { status: 404 });
    }

    return Response.json(tenant[0]);
  } catch (error) {
    console.error("ERRO GET SUBDOMAIN:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
