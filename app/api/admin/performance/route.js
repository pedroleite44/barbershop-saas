import { sql } from '../../../../lib/db.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = parseInt(searchParams.get('tenant_id') || 1);

    const result = await sql`
      SELECT 
        b.id as barber_id,
        b.name as barber_name,
        b.commission_percentage,
        COUNT(a.id) as total_appointments,
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN a.status = 'pending' THEN 1 END) as pending,
        COALESCE(SUM(CASE WHEN a.status IN ('confirmed','completed') THEN a.total_price ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN a.status IN ('confirmed','completed') THEN a.total_price * b.commission_percentage / 100 ELSE 0 END), 0) as commission_value
      FROM barbers b
      LEFT JOIN appointments a ON a.barber_id = b.id AND a.tenant_id = ${tenantId}
      WHERE b.tenant_id = ${tenantId}
      GROUP BY b.id, b.name, b.commission_percentage
      ORDER BY total_revenue DESC
    `;

    return Response.json({ success: true, data: result });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
