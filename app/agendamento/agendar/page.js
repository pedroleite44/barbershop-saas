"use client";

import { useState, useEffect } from 'react';

export default function AgendarPage() {
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

  const [theme, setTheme] = useState({
    primary: "#E50914",
    secondary: "#0A0A0A",
    accent: "#ffffff"
  });

  const tenantId = 1;

  const totalPrice = selectedServices.reduce((sum, serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return sum + (service ? parseFloat(service.price) : 0);
  }, 0);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function loadPageData() {
      try {
        setLoading(true);

        const settingsResponse = await fetch(`/api/public/settings?tenant_id=${tenantId}`);
        const settingsData = await settingsResponse.json();
        
        if (settingsData && settingsData.data) {
          const settings = settingsData.data || settingsData;
          setTenantSettings(settings);
          setTheme({
            primary: settings.primary_color || "#E50914",
            secondary: settings.secondary_color || "#0A0A0A",
            accent: settings.accent_color || "#ffffff"
          });
        } else if (settingsData) {
          setTenantSettings(settingsData);
          setTheme({
            primary: settingsData.primary_color || "#E50914",
            secondary: settingsData.secondary_color || "#0A0A0A",
            accent: settingsData.accent_color || "#ffffff"
          });
        }

        const barbersResponse = await fetch(`/api/public/barbers?tenant_id=${tenantId}`);
        const barbersData = await barbersResponse.json();
        setBarbers(barbersData.data || []);

        const servicesResponse = await fetch(`/api/services?tenant_id=${tenantId}`);
        const servicesData = await servicesResponse.json();
        setServices(servicesData.data || []);

      } catch (error) {
        console.error('Erro ao carregar dados da página:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPageData();
  }, []);

  useEffect(() => {
    if (selectedDate && barberId) {
      fetch(`/api/public/available-times?tenant_id=${tenantId}&barber_id=${barberId}&date=${selectedDate}`)
        .then(res => res.json())
        .then(data => {
          if (data.times) {
            setTimes(data.times);
          } else {
            console.error('Erro ao buscar horários:', data.error);
            setTimes([]);
          }
        });
    }
  }, [selectedDate, barberId]);

  function toggleService(serviceId) {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  }

  // Função para formatar a mensagem do WhatsApp
  function formatWhatsAppMessage() {
    const selectedBarberName = barbers.find(b => b.id == barberId)?.name || "Barbeiro";
    const servicesList = selectedServices.map(id => {
      const s = services.find(serv => serv.id === id);
      return s ? `• ${s.name} (R$ ${parseFloat(s.price).toFixed(2)})` : "";
    }).join("\n");

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

  async function handleBookAppointment() {
    if (!clientName || !clientPhone) {
      setMessage('❌ Por favor, preencha nome e telefone');
      return;
    }

    if (selectedServices.length === 0) {
      setMessage('❌ Por favor, selecione pelo menos um serviço');
      return;
    }

    if (!barberId) {
      setMessage('❌ Por favor, selecione um barbeiro');
      return;
    }

    if (!selectedDate || !selectedTime) {
      setMessage('❌ Por favor, selecione data e horário');
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
          setMessage("✅ Agendado com sucesso! Redirecionando para o WhatsApp...");
          
          // Lógica de Redirecionamento WhatsApp
          const whatsappMessage = formatWhatsAppMessage();
          const encodedMessage = encodeURIComponent(whatsappMessage);
          const rawPhone = tenantSettings?.phone || "";
          const cleanPhone = rawPhone.replace(/\D/g, "");
          const finalPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

          setTimeout(() => {
            if (finalPhone.length > 5) {
              window.open(`https://wa.me/${finalPhone}?text=${encodedMessage}`, '_blank' );
            } else {
              console.warn("Telefone da barbearia não configurado corretamente.");
            }
            
            // Limpar campos
            setClientName('');
            setClientPhone('');
            setSelectedTime('');
            setSelectedDate('');
            setBarberId('');
            setSelectedServices([]);
            setMessage('');
          }, 2000);
        } else {
          setMessage(`❌ Erro: ${result.error}`);
        }
      } else {
        setMessage('❌ Erro ao agendar');
      }
    } catch (err) {
      setMessage('❌ Erro de conexão');
    } finally {
      setLoading(false);
    }
  }

  function getDaysInMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  function getFirstDayOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  }

  function formatDate(day) {
    return `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  }

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
        <div style={{color: theme.primary, fontSize: 18}}>Carregando...</div>
      </div>
    );
  }

  return (
    <div style={{...styles.container, background: theme.secondary}}>

      <h1 style={{...styles.title, color: theme.primary}}>Agendar Horário</h1>

      <div style={{...styles.card, borderColor: theme.primary}}>

        {/* SELEÇÃO MÚLTIPLA DE SERVIÇOS */}
        <div style={styles.servicesSection}>
          <h3 style={{...styles.sectionTitle, color: theme.primary}}>Selecione os Serviços</h3>
          <div style={{...styles.servicesGrid, gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(120px, 1fr))' : 'repeat(auto-fill, minmax(150px, 1fr))'}}>
            {services.length > 0 ? (
              services.map((service) => (
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
                  {selectedServices.includes(service.id) && (
                    <div style={{marginTop: 8, color: theme.primary, fontSize: isMobile ? '10px' : '12px'}}>✓ Selecionado</div>
                  )}
                </div>
              ))
            ) : (
              <div style={{color: '#aaa', gridColumn: '1/-1', textAlign: 'center', padding: 20}}>
                Nenhum serviço disponível no momento
              </div>
            )}
          </div>

          {selectedServices.length > 0 && (
            <div style={{...styles.priceBox, borderColor: theme.primary, backgroundColor: `${theme.primary}15`, padding: isMobile ? '12px' : '15px'}}>
              <div style={{fontSize: isMobile ? '11px' : '12px', color: '#aaa', marginBottom: 5}}>Total dos Serviços:</div>
              <div style={{fontSize: isMobile ? '20px' : '24px', fontWeight: 'bold', color: theme.primary}}>
                R$ {totalPrice.toFixed(2)}
              </div>
              <div style={{fontSize: isMobile ? '10px' : '11px', color: '#777', marginTop: 5}}>
                {selectedServices.length} serviço(s) selecionado(s)
              </div>
            </div>
          )}
        </div>

        {/* BARBEIROS EM CARDS */}
        {selectedServices.length > 0 && (
          <div style={styles.barberSection}>
            <h3 style={{...styles.sectionTitle, color: theme.primary}}>Selecione um Barbeiro</h3>
            <div style={{...styles.barberGrid, gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(100px, 1fr))' : 'repeat(auto-fill, minmax(120px, 1fr))'}}>
              {barbers.map((b) => (
                <div
                  key={b.id}
                  onClick={() => {
                    setBarberId(b.id);
                    setSelectedDate('');
                    setSelectedTime('');
                  }}
                  style={{
                    ...styles.barberCard,
                    border: barberId == b.id ? `2px solid ${theme.primary}` : "1px solid #333",
                    padding: isMobile ? '12px' : '15px',
                  }}
                >
                  <div style={{...styles.avatar, backgroundColor: theme.primary, color: theme.secondary, width: isMobile ? '40px' : '50px', height: isMobile ? '40px' : '50px', fontSize: isMobile ? '16px' : '18px'}}>
                    {b.name.charAt(0).toUpperCase()}
                  </div>

                  <div style={{...styles.barberName, fontSize: isMobile ? '12px' : '14px'}}>{b.name}</div>
                  {b.specialty && <div style={{fontSize: isMobile ? '9px' : '11px', color: '#aaa'}}>{b.specialty}</div>}

                  {barberId == b.id && (
                    <div style={{ color: theme.primary, fontSize: isMobile ? '10px' : '12px', marginTop: 6 }}>
                      ✓ Selecionado
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CALENDÁRIO */}
        {barberId && selectedServices.length > 0 && (
          <>
            <div style={styles.calendarHeader}>
              <button onClick={()=>setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth()-1))} style={{...styles.navButton, backgroundColor: theme.primary, color: theme.secondary, padding: isMobile ? '8px 12px' : '10px 15px', fontSize: isMobile ? '14px' : '16px'}}>←</button>

              <h3 style={{...styles.monthName, color: theme.primary, fontSize: isMobile ? '14px' : '16px'}}>
                {currentMonth.toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}
              </h3>

              <button onClick={()=>setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth()+1))} style={{...styles.navButton, backgroundColor: theme.primary, color: theme.secondary, padding: isMobile ? '8px 12px' : '10px 15px', fontSize: isMobile ? '14px' : '16px'}}>→</button>
            </div>

            <div style={{...styles.calendar, gap: isMobile ? '3px' : '5px'}}>
              {days.map((day,i)=>{
                const dateStr = day ? formatDate(day) : '';
                const dateObj = day ? new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day) : null;
                const isPast = dateObj && dateObj < today;

                return (
                  <button
                    key={i}
                    disabled={!day || isPast}
                    onClick={()=>setSelectedDate(dateStr)}
                    style={{
                      ...styles.day,
                      background:selectedDate===dateStr?theme.primary:"#111",
                      color:isPast?"#555":"#fff",
                      opacity:isPast?0.5:1,
                      borderColor: selectedDate===dateStr ? theme.primary : '#333',
                      padding: isMobile ? '6px' : '10px',
                      fontSize: isMobile ? '12px' : '14px',
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* HORÁRIOS */}
        {selectedDate && selectedServices.length > 0 && (
          <div style={{...styles.times, gap: isMobile ? '6px' : '10px'}}>
            {times.map(slot=>(
              <button
                key={slot.time}
                onClick={()=>slot.available && setSelectedTime(slot.time)}
                disabled={!slot.available}
                style={{
                  ...styles.time,
                  background:selectedTime===slot.time?theme.primary:slot.available?"#111":"#333",
                  color:slot.available?"#fff":"#777",
                  borderColor: selectedTime===slot.time ? theme.primary : '#333',
                  padding: isMobile ? '8px 10px' : '10px 12px',
                  fontSize: isMobile ? '12px' : '14px',
                }}
              >
                {slot.time}
              </button>
            ))}
          </div>
        )}

        {/* DADOS */}
        {selectedTime && selectedServices.length > 0 && (
          <>
            <div style={{...styles.resumoBox, borderColor: theme.primary, padding: isMobile ? '12px' : '15px'}}>
              <div style={{fontSize: isMobile ? '11px' : '12px', color: '#aaa', marginBottom: 8}}>Resumo do Agendamento:</div>
              
              <div style={{marginBottom: 8}}>
                {selectedServices.map(serviceId => {
                  const service = services.find(s => s.id === serviceId);
                  return (
                    <div key={serviceId} style={{color: theme.primary, fontWeight: 'bold', marginBottom: 2, fontSize: isMobile ? '12px' : '14px'}}>
                      ✂️ {service?.name} - R$ {parseFloat(service?.price || 0).toFixed(2)}
                    </div>
                  );
                })}
              </div>

              <div style={{borderTop: `1px solid #333`, paddingTop: 8, marginBottom: 8}}>
                <div style={{color: theme.primary, fontWeight: 'bold', fontSize: isMobile ? '13px' : '14px'}}>
                  Total: R$ {totalPrice.toFixed(2)}
                </div>
              </div>

              <div style={{fontSize: isMobile ? '11px' : '12px', color: '#fff'}}>
                {barbers.find(b => b.id == barberId)?.name} • {selectedDate.split('-').reverse().join('/')} às {selectedTime}
              </div>
            </div>

            <input placeholder="Nome" value={clientName} onChange={e=>setClientName(e.target.value)} style={{...styles.input, borderColor: '#333', padding: isMobile ? '10px' : '12px', fontSize: isMobile ? '14px' : '16px'}}/>
            <input placeholder="Telefone" value={clientPhone} onChange={e=>setClientPhone(e.target.value)} style={{...styles.input, borderColor: '#333', padding: isMobile ? '10px' : '12px', fontSize: isMobile ? '14px' : '16px'}}/>

            <button 
              style={{...styles.button, background: theme.primary, color: theme.secondary, padding: isMobile ? '10px' : '12px', fontSize: isMobile ? '14px' : '16px', opacity: loading ? 0.7 : 1}} 
              onClick={handleBookAppointment}
              disabled={loading}
            >
              {loading ? "Processando..." : "Confirmar e Enviar via WhatsApp"}
            </button>
          </>
        )}

        {message && <div style={{...styles.message, color: message.includes('✅') ? '#4CAF50' : '#FF6B6B', fontSize: isMobile ? '12px' : '14px', padding: isMobile ? '10px' : '12px'}}>{message}</div>}

      </div>
    </div>
  );
}

const styles = {
  container:{padding: '15px', minHeight:'100vh'},
  card:{maxWidth:800, margin:'0 auto', padding: '20px', background:'#111', border:'1px solid', borderRadius:10},
  title: { fontSize: '24px', marginBottom: '20px', textAlign: 'center' },
  sectionTitle: { marginBottom: 15, fontSize: '16px' },
  servicesSection:{marginBottom:20},
  servicesGrid:{ display:"grid", gap:12, marginBottom:20 },
  serviceCard:{ padding:15, borderRadius:8, cursor:"pointer", textAlign:"center", border:'1px solid', transition:'all 0.3s' },
  priceBox:{ borderRadius:8, border:'2px solid', textAlign:'center', marginBottom:20 },
  barberSection:{marginBottom:20},
  barberGrid:{ display:"grid", gap:12, marginBottom:20 },
  barberCard:{ borderRadius:8, cursor:"pointer", textAlign:"center", border:'1px solid #333' },
  avatar:{ borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 8px", fontWeight:'bold' },
  barberName:{fontWeight:"bold", marginBottom: 4},
  input:{width:'100%', marginBottom:10, background:'#000', color:'#fff', border:'1px solid', borderRadius:4, boxSizing: 'border-box'},
  calendarHeader:{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:15},
  navButton:{border:'none', cursor:'pointer', borderRadius:4, fontWeight:'bold'},
  monthName:{textTransform:'capitalize', margin:0, flex: 1, textAlign: 'center'},
  calendar:{display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:20},
  day:{border:'1px solid', borderRadius:4, background:'#111', color:'#fff', cursor:'pointer', fontWeight: '500'},
  times:{display:'flex', flexWrap:'wrap', marginBottom:20},
  time:{border:'1px solid', borderRadius:4, background:'#111', color:'#fff', cursor:'pointer'},
  resumoBox: { marginBottom: 20, backgroundColor: '#1a1a1a', borderRadius: 8, borderLeft: '4px solid' },
  button:{padding:12, border:'none', fontWeight:'bold', borderRadius:4, cursor:'pointer', width:'100%'},
  message:{marginTop:10, borderRadius:4, textAlign:'center', fontWeight:'bold'}
};
