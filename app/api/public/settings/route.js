import { initDatabase, sql } from "../../../../lib/db.js";

export async function GET(req) {
  try {
    await initDatabase();
    
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenant_id");

    if (!tenantId) {
      return Response.json({ 
        success: false,
        error: "Tenant ID é obrigatório" 
      }, { status: 400 });
    }

    const settings = await sql`
      SELECT * FROM tenant_settings
      WHERE tenant_id = ${parseInt(tenantId)}
      LIMIT 1
    `;

    if (settings.length === 0) {
      // Retornar valores padrão se não encontrar
      return Response.json({
        success: true,
        data: {
          tenant_id: parseInt(tenantId),
          name: "Barbearia",
          phone: "(00) 00000-0000",
          address: "Rua Principal, 123",
          city: "São Paulo",
          state: "SP",
          zip_code: "00000-000",
          opening_time: "09:00",
          closing_time: "19:00",
          description: "Barbearia profissional",
          primary_color: "#E50914",
          secondary_color: "#000000",
          accent_color: "#FFFFFF",
          logo_url: "",
          banner_url: ""
        }
      });
    }

    return Response.json({
      success: true,
      data: settings[0]
    });
  } catch (error) {
    console.error("Erro ao buscar configurações públicas:", error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}
