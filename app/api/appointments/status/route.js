﻿import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';
 
// Normaliza status em português para inglês
function normalizeStatus(status) {
  const map = {
    'pendente': 'pending',
    'confirmado': 'confirmed',
    'concluído': 'completed',
    'cancelado': 'cancelled',
  };
  return map[status] || status;
}
 
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, status: rawStatus, tenant_id } = body;
 
    console.log('📥 PATCH /api/appointments/status recebido:', { id, rawStatus, tenant_id });
 
    if (!id || !rawStatus || !tenant_id) {
      return NextResponse.json({ success: false, error: 'ID, status e tenant_id são obrigatórios' }, { status: 400 });
    }
 
    const status = normalizeStatus(rawStatus);
    const appointmentId = parseInt(id);
    const tenantId = parseInt(tenant_id);
 
    console.log('🔄 Valores convertidos:', { appointmentId, status, tenantId });
 
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: `Status inválido: ${status}` }, { status: 400 });
    }
 
    const result = await sql`
      UPDATE appointments 
      SET status = ${status}, updated_at = NOW() 
      WHERE id = ${appointmentId} AND tenant_id = ${tenantId}
      RETURNING id, status, tenant_id
    `;
 
    console.log('✅ Resultado do UPDATE:', result);
 
    if (result.length === 0) {
      console.log('⚠️ Nenhuma linha atualizada! Verificando agendamento...');
      const check = await sql`
        SELECT id, tenant_id, status FROM appointments WHERE id = ${appointmentId}
      `;
      console.log('🔍 Agendamento no banco:', check);
      return NextResponse.json({ 
        success: false, 
        error: `Nenhum agendamento encontrado com id=${appointmentId} e tenant_id=${tenantId}. No banco: ${JSON.stringify(check)}` 
      }, { status: 404 });
    }
 
    return NextResponse.json({ success: true, message: 'Status atualizado com sucesso', data: result[0] });
  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
 