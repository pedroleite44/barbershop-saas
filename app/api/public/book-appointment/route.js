import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // LOG para depuração no terminal
    console.log('--- PROCESSANDO AGENDAMENTO ---', body);

    // Mapeamento flexível para aceitar tanto camelCase quanto snake_case
    const tenantId = Number(body.tenant_id || body.tenantId || 1);
    const barberId = Number(body.barber_id || body.barberId);
    const clientName = body.client_name || body.clientName || "Cliente Online";
    const clientPhone = body.phone || body.clientPhone;
    const appointmentDate = body.date || body.appointmentDate;
    const appointmentTime = body.time || body.appointmentTime;
    const serviceIds = body.service_ids || body.serviceIds || [];
    
    // Garantir que serviceIds seja um array para não quebrar o .map
    const safeServiceIds = Array.isArray(serviceIds) ? serviceIds : [serviceIds];

    // Validação básica (removi as travas que causavam o erro 400 se algo viesse vazio)
    if (!tenantId || !appointmentDate || !appointmentTime) {
      return NextResponse.json({ success: false, error: "Dados obrigatórios faltando (Tenant, Data ou Hora)" }, { status: 400 });
    }

    // 1. Buscar nomes dos serviços
    let serviceNames = "Serviço não especificado";
    if (safeServiceIds.length > 0) {
      try {
        const ids = safeServiceIds.map(id => Number(id));
        const services = await sql`SELECT name FROM services WHERE id IN (${sql(ids)})`;
        if (services.length > 0) {
          serviceNames = services.map(s => s.name).join(", ");
        }
      } catch (e) {
        console.log("Aviso: Erro ao buscar nomes dos serviços, usando padrão.");
      }
    }

    const serviceIdsString = safeServiceIds.join(",");

    // 2. Inserir no banco (usando as colunas que você já tem)
    const result = await sql`
      INSERT INTO appointments (
        tenant_id, 
        barber_id, 
        date, 
        time, 
        phone, 
        client_name, 
        service_ids, 
        service_names, 
        status
      ) VALUES (
        ${tenantId}, 
        ${barberId || null}, 
        ${appointmentDate}, 
        ${appointmentTime}, 
        ${clientPhone || 'Sem Telefone'}, 
        ${clientName},
        ${serviceIdsString}, 
        ${serviceNames}, 
        'pending'
      ) RETURNING id;
    `;

    console.log("✅ Agendado com sucesso! ID:", result[0].id);
    return NextResponse.json({ success: true, appointmentId: result[0].id });

  } catch (error) {
    console.error("❌ ERRO NO AGENDAMENTO:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = Number(searchParams.get("tenant_id") || 1);
    const date = searchParams.get("date");

    if (!date) return NextResponse.json({ success: false, error: "Data é obrigatória" }, { status: 400 });

    const result = await sql`
      SELECT id, tenant_id, barber_id, date, time, 
             phone, client_name, service_names, status
      FROM appointments
      WHERE tenant_id = ${tenantId} AND date = ${date}
      ORDER BY time
    `;

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}