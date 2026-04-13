import { sql } from "../../../lib/db.js";
import { NextResponse } from "next/server";

export async function PUT(request) {
  try {
    const body = await request.json();
    const { 
      tenantId, 
      name, 
      slug, 
      phone, 
      logoUrl, 
      bannerUrl, 
      instagramUrl, 
      primaryColor, 
      secondaryColor, 
      accentColor, 
      description, 
      address, 
      openingHours, 
      appointmentInterval,
      email, 
      city, 
      state, 
      zipCode, 
      openingTime, 
      closingTime 
    } = body;

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'ID do tenant não fornecido.' }, { status: 400 });
    }

    const updateFields = {
      name: name,
      slug: slug,
      phone: phone,
      logo_url: logoUrl,
      banner_url: bannerUrl,
      instagram_url: instagramUrl,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      accent_color: accentColor,
      description: description,
      address: address,
      opening_hours: openingHours,
      appointment_interval: appointmentInterval,
      email: email, 
      city: city, 
      state: state, 
      zip_code: zipCode, 
      opening_time: openingTime, 
      closing_time: closingTime, 
      updated_at: new Date().toISOString(), 
    };

    const filteredFields = Object.fromEntries(
      Object.entries(updateFields).filter(([, value]) => value !== undefined && value !== null)
    );

    const setClauses = Object.keys(filteredFields).map((key, index) => `"${key}" = $${index + 2}`);
    const setValues = Object.values(filteredFields);

    if (setClauses.length === 0) {
      return NextResponse.json({ success: false, error: 'Nenhum campo para atualizar fornecido.' }, { status: 400 });
    }

    const query = `
      UPDATE tenant_settings
      SET ${setClauses.join(', ')}
      WHERE tenant_id = $1
      RETURNING *;
    `;

    // CORREÇÃO AQUI: Usando sql.query para suportar o formato de placeholders ($1, $2...)
    const result = await sql.query(query, [tenantId, ...setValues]);

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: 'Configurações não encontradas.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
