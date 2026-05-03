"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function AgendarPage() {
  const params = useParams();
  const slug = params.slug;

  // Estados de Dados e Interface
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState('');
  const [times, setTimes] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [barbers, setBarbers] = useState([]);
  const [barberId, setBarberId] = useState('');
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [tenantSettings, setTenantSettings] = useState(null);
  const [tenantId, setTenantId] = useState(null);

  // Tema Dinâmico
  const [theme, setTheme] = useState({
    primary: "#E50914",
    secondary: "#0A0A0A",
    accent: "#ffffff"
  });

  // Cálculo de Total
  const totalPrice = selectedServices.reduce((sum, serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return sum + (service ? parseFloat(service.price) : 0);
  }, 0);

  // Detecção de Mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Carregamento de Dados Multi-tenant
  useEffect(() => {
    async function loadPageData() {
      if (!slug) {
        setLoading(false);
        setMessage('❌ Link da barbearia inválido.');
        return;
      }
      
      try {
        setLoading(true);
        const settingsResponse = await fetch(`/api/public/settings?slug=${slug}`);
        const settingsData = await settingsResponse.json();
        
        if (settingsData && settingsData.success) {
          const settings = settingsData.data;
          const realTenantId = settings.id;
          
          setTenantId(realTenantId);
          setTenantSettings(settings);
          setTheme({
            primary: settings.primary_color || "#E50914",
            secondary: settings.secondary_color || "#0A0A0A",
            accent: settings.accent_color || "#ffffff"
          });

          // Busca Barbeiros e Serviços em paralelo
          const [barbersRes, servicesRes] = await Promise.all([
            fetch(`/api/public/barbers?tenant_id=${realTenantId}`),
            fetch(`/api/services?tenant_id=${realTenantId}`)
          ]);

          const bData = await barbersRes.json();
          const sData = await servicesRes.json();

          setBarbers(bData.data || []);
          setServices(sData.data || []);
        } else {
          setMessage('❌ Barbearia não encontrada.');
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setMessage('❌ Erro ao carregar dados da página.');
      } finally {
        setLoading(false);
      }
    }
    loadPageData();
  }, [slug]);

  // Busca de Horários Disponíveis
  useEffect(() => {
    if (selectedDate && barberId && tenantId) {
      fetch(`/api/public/available-times?tenant_id=${tenantId}&barber_id=${barberId}&date=${selectedDate}`)
        .then(res => res.json())
        .then(data => {
          setTimes(data.times || []);
        })
        .catch(err => {
          console.error('Erro ao buscar horários:', err);
          setTimes([]);
        });
    }
  }, [selectedDate, barberId, tenantId]);

  // Seleção de Serviços
  function toggleService(serviceId) {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  }

  // Formatação de Mensagem WhatsApp
  function formatWhatsAppMessage() {
    const selectedBarberName = barbers.find(b => b.id == barberId)?.name || "Barbeiro";
    const servicesList = selectedServices.map(id => {
      const s = services.find(serv => serv.id === id);
      return s ? `• ${s.name} (R$ ${parseFloat(s.price).toFixed(2)})` : "";
    }).filter(Boolean).join("\n");

    const [year, month, day] = selectedDate.split('-');
    const formattedDate = `${day}/${month}/${year}`;

    return `🚨 *NOVO AGENDAMENTO* 🚨\n\n` +
           `👤 *Cliente:* ${clientName}\n` +
           `📞 *Telefone:* ${clientPhone}\n\n` +
           `✂️ *Serviços:*\n${servicesList}\n\n` +
           `🧔 *Barbeiro:* ${selectedBarberName}\n` +
           `📅 *Data:* ${formattedDate}\n` +
           `⏰ *Hora:* ${selectedTime}\n` +
           `💰 *Total:* R$ ${totalPrice.toFixed(2)}\n\n` +
           `_Por favor, confirme se o horário está disponível!_`;
  }

  // Finalização do Agendamento
  async function handleBookAppointment() {
    if (!clientName || !clientPhone) {
      setMessage('❌ Por favor, preencha seu nome e WhatsApp.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/public/book-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: Number(tenantId),
          barberId: Number(barberId),
          serviceIds: selectedServices.map(id => Number(id)),
          totalPrice: parseFloat(totalPrice),
          clientName,
          clientPhone,
          appointmentDate: selectedDate,
          appointmentTime: selectedTime,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setMessage("✅ Agendado com sucesso! Redirecionando...");
          
          const whatsappMessage = formatWhatsAppMessage();
          const rawPhone = tenantSettings?.phone || "";
          const cleanPhone = rawPhone.replace(/\D/g, "");
          const finalPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

          setTimeout(() => {
            if (finalPhone.length > 5) {
              window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(whatsappMessage )}`, '_blank' );
            }
            window.location.reload();
          }, 2000);
        } else {
          setMessage(`❌ Erro: ${result.error}`);
        }
      } else {
        setMessage('❌ Erro ao processar agendamento.');
      }
    } catch (err) {
      setMessage('❌ Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  }

  // Auxiliares do Calendário
  function getDaysInMonth(date) { return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(); }
  function getFirstDayOfMonth(date) { return new Date(date.getFullYear(), date.getMonth(), 1).getDay(); }
  function formatDate(day) { return `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`; }

  const today = new Date();
  today.setHours(0,0,0,0);

  const days = [];
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);

  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  if (loading && !tenantSettings) {
    return (
      <div style={{...styles.container, background: theme.secondary, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{color: theme.primary, fontSize: 18}}>Carregando barbearia...</div>
      </div>
    );
  }

  return (
    <div style={{...styles.container, background: theme.secondary}}>
      <h1 style={{...styles.title, color: theme.primary}}>Agendar Horário</h1>
      <div style={{...styles.card, borderColor: theme.primary}}>
        
        {/* 1. SEÇÃO DE SERVIÇOS (Sempre visível) */}
        <div style={styles.servicesSection}>
          <h3 style={{...styles.sectionTitle, color: theme.primary}}>Selecione os Serviços</h3>
          <div style={{...styles.servicesGrid, gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(120px, 1fr))' : 'repeat(auto-fill, minmax(150px, 1fr))'}}>
            {services.map((service) => (
              <div
                key={service.id}
                onClick={() => toggleService(service.id)}
                style={{
                  ...styles.serviceCard,
                  borderColor: selectedServices.includes(service.id) ? theme.primary : '#333',
                  backgroundColor: selectedServices.includes(service.id) ? `${theme.primary}20` : '#111',
                  borderWidth: selectedServices.includes(service.id) ? '2px' : '1px',
                  padding: isMobile ? '12px' : '15px',
                }}
              >
                <div style={{fontSize: isMobile ? 20 : 24, marginBottom: 8}}>✂️</div>
                <div style={{fontWeight: 'bold', marginBottom: 4, fontSize: isMobile ? '13px' : '14px'}}>{service.name}</div>
                <div style={{fontSize: isMobile ? '10px' : '12px', color: '#aaa', marginBottom: 6}}>{service.description}</div>
                <div style={{color: theme.primary, fontWeight: 'bold', fontSize: isMobile ? '12px' : '14px'}}>R$ {parseFloat(service.price).toFixed(2)}</div>
                <div style={{fontSize: isMobile ? '9px' : '11px', color: '#777', marginTop: 4}}>{service.duration} min</div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. SEÇÃO DE BARBEIRO (Aparece após selecionar serviço) */}
        {selectedServices.length > 0 && (
          <div style={styles.barberSection}>
            <h3 style={{...styles.sectionTitle, color: theme.primary}}>Selecione o Barbeiro</h3>
            <div style={styles.barberGrid}>
              {barbers.map(barber => (
                <div 
                  key={barber.id}
                  onClick={() => setBarberId(barber.id)}
                  style={{
                    ...styles.barberCard,
                    borderColor: barberId === barber.id ? theme.primary : '#333',
                    backgroundColor: barberId === barber.id ? `${theme.primary}20` : '#111'
                  }}
                >
                  <div style={styles.barberPhoto}>
                    {barber.photo_url ? <img src={barber.photo_url} alt={barber.name} style={styles.barberImg} /> : '🧔'}
                  </div>
                  <div style={{fontWeight: 'bold'}}>{barber.name}</div>
                  <div style={{fontSize: '12px', color: '#aaa'}}>{barber.specialty}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. SEÇÃO DE CALENDÁRIO (Aparece após selecionar barbeiro) */}
        {barberId && (
          <div style={styles.calendarSection}>
            <h3 style={{...styles.sectionTitle, color: theme.primary}}>Selecione a Data</h3>
            <div style={styles.calendarHeader}>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} style={styles.calBtn}>&lt;</button>
              <span style={{fontWeight: 'bold'}}>{currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</span>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} style={styles.calBtn}>&gt;</button>
            </div>
            <div style={styles.calendarGrid}>
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <div key={d} style={styles.dayHeader}>{d}</div>)}
              {days.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} />;
                const dateStr = formatDate(day);
                
                // CORREÇÃO: Criar data no fuso horário local para habilitar o dia de hoje
                const [y, m, d] = dateStr.split('-').map(Number);
                const calendarDate = new Date(y, m - 1, d);
                const isPast = calendarDate < today;
                
                const isSelected = selectedDate === dateStr;
                return (
                  <button
                    key={day}
                    disabled={isPast}
                    onClick={() => setSelectedDate(dateStr)}
                    style={{
                      ...styles.dayBtn,
                      backgroundColor: isSelected ? theme.primary : 'transparent',
                      color: isPast ? '#444' : (isSelected ? theme.accent : '#fff'),
                      cursor: isPast ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. SEÇÃO DE HORÁRIOS (Aparece após selecionar data) */}
        {selectedDate && (
          <div style={styles.timeSection}>
            <h3 style={{...styles.sectionTitle, color: theme.primary}}>Horários Disponíveis</h3>
            <div style={styles.timeGrid}>
              {times.map(t => (
                <button
                  key={t.time}
                  disabled={!t.available}
                  onClick={() => setSelectedTime(t.time)}
                  style={{
                    ...styles.timeBtn,
                    backgroundColor: selectedTime === t.time ? theme.primary : (t.available ? '#222' : '#111'),
                    color: t.available ? '#fff' : '#444',
                    borderColor: selectedTime === t.time ? theme.primary : '#333'
                  }}
                >
                  {t.time}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 5. SEÇÃO DE DADOS FINAIS (Aparece após selecionar horário) */}
        {selectedTime && (
          <div style={styles.formSection}>
            <h3 style={{...styles.sectionTitle, color: theme.primary}}>Seus Dados</h3>
            <input style={styles.input} placeholder="Seu Nome" value={clientName} onChange={e => setClientName(e.target.value)} />
            <input style={styles.input} placeholder="Seu WhatsApp" value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
            <div style={styles.summary}>
              <p>Total: <span style={{color: theme.primary, fontWeight: 'bold'}}>R$ {totalPrice.toFixed(2)}</span></p>
            </div>
            <button onClick={handleBookAppointment} disabled={loading} style={{...styles.confirmBtn, backgroundColor: theme.primary, color: theme.accent}}>
              {loading ? 'Processando...' : 'Confirmar Agendamento'}
            </button>
            {message && <p style={{...styles.message, color: message.includes('✅') ? '#4ade80' : '#f87171'}}>{message}</p>}
          </div>
        )}

      </div>
    </div>
  );
}

// ESTILOS ORIGINAIS COMPLETOS
const styles = {
  container: { minHeight: '100vh', padding: '40px 20px', color: '#fff', fontFamily: 'Arial, sans-serif' },
  title: { textAlign: 'center', fontSize: '32px', marginBottom: '40px', fontWeight: 'bold' },
  card: { maxWidth: '800px', margin: '0 auto', backgroundColor: '#111', borderRadius: '15px', padding: '30px', border: '1px solid #333' },
  sectionTitle: { fontSize: '18px', marginBottom: '20px', fontWeight: 'bold' },
  servicesSection: { marginBottom: '40px' },
  servicesGrid: { display: 'grid', gap: '15px' },
  serviceCard: { borderRadius: '10px', cursor: 'pointer', transition: '0.3s', border: '1px solid #333', textAlign: 'center' },
  barberSection: { marginBottom: '40px' },
  barberGrid: { display: 'flex', gap: '15px', flexWrap: 'wrap' },
  barberCard: { padding: '15px', borderRadius: '10px', cursor: 'pointer', border: '1px solid #333', textAlign: 'center', minWidth: '120px' },
  barberPhoto: { width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#222', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', overflow: 'hidden' },
  barberImg: { width: '100%', height: '100%', objectFit: 'cover' },
  calendarSection: { marginBottom: '40px' },
  calendarHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  calBtn: { background: '#222', border: 'none', color: '#fff', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer' },
  calendarGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', textAlign: 'center' },
  dayHeader: { fontSize: '12px', color: '#666', padding: '5px' },
  dayBtn: { padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  timeSection: { marginBottom: '40px' },
  timeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '10px' },
  timeBtn: { padding: '10px', borderRadius: '5px', border: '1px solid #333', cursor: 'pointer' },
  formSection: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { padding: '15px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#222', color: '#fff' },
  summary: { padding: '15px', backgroundColor: '#1a1a1a', borderRadius: '8px', textAlign: 'right' },
  confirmBtn: { padding: '18px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' },
  message: { textAlign: 'center', fontWeight: 'bold', marginTop: '10px' }
};