import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';
 
export async function POST(request) {
  try {
    const body = await request.json();
    
    console.log('--- PROCESSANDO AGENDAMENTO ---', body);
 
    const tenantId = Number(body.tenant_id || body.tenantId || 1);
    const barberId = Number(body.barber_id || body.barberId);
    const clientName = body.client_name || body.clientName || "Cliente Online";
    const clientPhone = body.phone || body.clientPhone;
    const appointmentDate = body.date || body.appointmentDate;
    const appointmentTime = body.time || body.appointmentTime;
    const serviceIds = body.service_ids || body.serviceIds || [];
    
    const safeServiceIds = Array.isArray(serviceIds) ? serviceIds : [serviceIds];
 
    if (!tenantId || !appointmentDate || !appointmentTime) {
      return NextResponse.json({ success: false, error: "Dados obrigatórios faltando (Tenant, Data ou Hora)" }, { status: 400 });
    }
 
    // Buscar nomes e preços dos serviços — query individual para evitar problema com IN
    let serviceNames = "Serviço não especificado";
    let totalPrice = 0;
 
    if (safeServiceIds.length > 0) {
      try {
        const ids = safeServiceIds.map(id => Number(id)).filter(id => !isNaN(id) && id > 0);
        console.log('🔍 Buscando serviços com IDs:', ids);
        
        if (ids.length > 0) {
          // Busca cada serviço individualmente para evitar problema com IN (${sql(ids)})
          const serviceResults = await Promise.all(
            ids.map(id => sql`SELECT name, price FROM services WHERE id = ${id}`)
          );
          
          const foundServices = serviceResults.flat();
          console.log('✅ Serviços encontrados:', foundServices);
          
          if (foundServices.length > 0) {
            serviceNames = foundServices.map(s => s.name).join(", ");
            totalPrice = foundServices.reduce((acc, s) => acc + Number(s.price || 0), 0);
          }
        }
      } catch (e) {
        console.error("❌ Erro ao buscar serviços:", e.message);
      }
    }
 
    console.log('📋 serviceNames:', serviceNames, '| totalPrice:', totalPrice);
 
    const serviceIdsString = safeServiceIds.join(",");
 
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
        total_price,
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
        ${totalPrice},
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