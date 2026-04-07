// Twilio WhatsApp Integration
// Para usar, configure as variáveis de ambiente:
// TWILIO_ACCOUNT_SID
// TWILIO_AUTH_TOKEN
// TWILIO_WHATSAPP_FROM (ex: whatsapp:+5511999999999)

export async function POST(req) {
  try {
    const { phone, message } = await req.json();

    // Validação básica
    if (!phone || !message) {
      return Response.json(
        { error: "Telefone e mensagem são obrigatórios" },
        { status: 400 }
      );
    }

    // Se as credenciais do Twilio não estão configuradas, retornar sucesso simulado
    if (
      !process.env.TWILIO_ACCOUNT_SID ||
      !process.env.TWILIO_AUTH_TOKEN ||
      !process.env.TWILIO_WHATSAPP_FROM
    ) {
      console.log(
        "⚠️  Twilio não configurado. Mensagem simulada para:",
        phone,
        message
      );
      return Response.json({
        success: true,
        message: "Mensagem simulada (Twilio não configurado)",
        phone,
      });
    }

    // Formatar telefone para Twilio (adicionar whatsapp: e código do país se necessário)
    let formattedPhone = phone.replace(/\D/g, ""); // Remove caracteres não numéricos
    if (!formattedPhone.startsWith("55")) {
      formattedPhone = "55" + formattedPhone; // Adicionar código do Brasil
    }
    const twilioPhone = `whatsapp:+${formattedPhone}`;

    // Chamar API do Twilio
    const auth = Buffer.from(
      `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
    ).toString("base64");

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: process.env.TWILIO_WHATSAPP_FROM,
          To: twilioPhone,
          Body: message,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro Twilio:", data);
      return Response.json(
        { error: "Erro ao enviar mensagem" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: "Mensagem enviada com sucesso",
      messageSid: data.sid,
    });
  } catch (error) {
    console.error("ERRO WhatsApp:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
