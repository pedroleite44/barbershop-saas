/**
 * Módulo de integração com WhatsApp
 * Responsável por enviar notificações de agendamento para as barbearias
 */

export function formatAppointmentMessage(appointmentData) {
  const {
    barbershopName,
    clientName,
    clientPhone,
    barberName,
    serviceNames,
    appointmentDate,
    appointmentTime,
    totalPrice,
  } = appointmentData;

  const [year, month, day] = appointmentDate.split('-');
  const formattedDate = `${day}/${month}/${year}`;
  const formattedPrice = parseFloat(totalPrice).toFixed(2);

  return `🚨 NOVO AGENDAMENTO! 🚨

Barbearia: ${barbershopName}

📋 Detalhes do Cliente:
Nome: ${clientName}
Telefone: ${clientPhone}

✂️ Detalhes do Agendamento:
Barbeiro: ${barberName}
Serviços: ${serviceNames}
Data: ${formattedDate}
Hora: ${appointmentTime}
Valor Total: R$ ${formattedPrice}

✅ Status: Confirmado`;
}

export async function sendWhatsAppMessage(phoneNumber, message) {
  try {
    if (!process.env.WHATSAPP_API_URL) {
      console.warn("⚠️ WHATSAPP_API_URL não configurada.");
      return { success: false, error: "WHATSAPP_API_URL não configurada" };
    }

    const payload = {
      to: phoneNumber,
      message: message,
      token: process.env.WHATSAPP_API_TOKEN || "",
      instanceKey: process.env.WHATSAPP_INSTANCE_KEY || "",
    };

    const response = await fetch(process.env.WHATSAPP_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) return { success: false, error: `Erro HTTP ${response.status}` };
    
    return { success: true, data: await response.json() };
  } catch (error) {
    console.error("❌ Erro WhatsApp:", error.message);
    return { success: false, error: error.message };
  }
}

export async function sendAppointmentNotification(appointmentData, barbershopPhone) {
  if (!barbershopPhone) return { success: false, error: "Telefone não fornecido" };
  const message = formatAppointmentMessage(appointmentData);
  return await sendWhatsAppMessage(barbershopPhone, message);
}