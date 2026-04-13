import fs from "fs";
import path from "path";
import { initDatabase, sql } from "../../../lib/db.js";
import { requireAuth } from "../../../lib/auth.js";

export async function POST(req) {
  try {
    await initDatabase();
    const { auth, error } = requireAuth(req, ["admin"]);
    if (error) return error;

    const formData = await req.formData();
    const file = formData.get("file");
    const type = formData.get("type") || "gallery";

    if (!file) {
      return Response.json({ error: "Arquivo não fornecido" }, { status: 400 });
    }

    // Criar diretório de uploads específico para o tenant
    const uploadsDir = path.join(process.cwd(), "public", "uploads", String(auth.tenant_id));
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const filepath = path.join(uploadsDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filepath, buffer);

    const fileUrl = `/uploads/${auth.tenant_id}/${filename}`;

    // 1. SALVAR NA GALERIA
    if (type === "gallery") {
      const result = await sql`
        INSERT INTO tenant_gallery (tenant_id, image_url, created_at)
        VALUES (${auth.tenant_id}, ${fileUrl}, NOW())
        RETURNING *
      `;
      return Response.json(result[0], { status: 201 });
    }

    // 2. SALVAR COMO BANNER
    if (type === "banner") {
      await sql`
        UPDATE tenant_settings 
        SET banner_url = ${fileUrl}, updated_at = NOW()
        WHERE tenant_id = ${auth.tenant_id}
      `;
      return Response.json({ success: true, url: fileUrl });
    }

    // 3. SALVAR COMO LOGO
    if (type === "logo") {
      await sql`
        UPDATE tenant_settings 
        SET logo_url = ${fileUrl}, updated_at = NOW()
        WHERE tenant_id = ${auth.tenant_id}
      `;
      return Response.json({ success: true, url: fileUrl });
    }

    // 4. SE FOR FOTO DE BARBEIRO, RETORNAR APENAS A URL
    return Response.json({ success: true, url: fileUrl });

  } catch (error) {
    console.error("ERRO UPLOAD:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await initDatabase();
    const { auth, error } = requireAuth(req, ["admin"]);
    if (error) return error;

    const data = await sql`
      SELECT id, tenant_id, image_url, created_at
      FROM tenant_gallery
      WHERE tenant_id = ${auth.tenant_id}
      ORDER BY created_at DESC
    `;
    return Response.json(data);
  } catch (error) {
    console.error("ERRO GET GALLERY:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { auth, error } = requireAuth(req, ["admin"]);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!id) {
      return Response.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    // Opcional: Você pode querer deletar o arquivo físico do servidor aqui também
    await sql`
      DELETE FROM tenant_gallery
      WHERE id = ${id} AND tenant_id = ${auth.tenant_id}
    `;
    return Response.json({ success: true });
  } catch (error) {
    console.error("ERRO DELETE GALLERY:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
