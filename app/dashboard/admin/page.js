'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// --- COMPONENTE DE REENGAJAMENTO ATUALIZADO PARA WHATSAPP WEB ---
function ReengagementTab({ tenantId, apiCall, showNotification, isMobile }) {
  const [inactiveClients, setInactiveClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messageTemplate, setMessageTemplate] = useState('Olá {nome}, faz um tempo que não nos vemos na barbearia! Que tal agendar um novo horário para dar aquele tapa no visual? ✂️');

  useEffect(() => {
    if (tenantId) fetchInactiveClients();
  }, [tenantId]);

  async function fetchInactiveClients() {
    try {
      setLoading(true);
      const data = await apiCall(`/api/admin/reengagement?tenant_id=${tenantId}&days=15`);
      if (data.success) {
        setInactiveClients(data.data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar clientes inativos:', error);
      showNotification('Erro ao buscar clientes inativos', 'error');
    } finally {
      setLoading(false);
    }
  }

  // NOVA FUNÇÃO: Abre o WhatsApp Web para o cliente
  function openWhatsApp(client) {
    const cleanPhone = client.phone.replace(/\D/g, ''); // Remove parênteses, espaços e traços
    const message = messageTemplate.replace('{nome}', client.client_name);
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    window.open(url, '_blank');
  }

  const localStyles = {
    configCard: { backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px', padding: '20px', marginBottom: '20px' },
    formSectionTitle: { fontSize: '16px', fontWeight: 'bold', color: '#E50914', marginBottom: '10px' },
    description: { fontSize: '13px', color: '#aaa', marginBottom: '10px' },
    textarea: { width: '100%', padding: '12px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', color: '#fff', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit' },
    table: { backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px', overflow: 'hidden' },
    tableHeader: { display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1.5fr 1.5fr 1fr', padding: '15px', backgroundColor: '#1a1a1a', borderBottom: '1px solid #222', fontWeight: 'bold' },
    tableCell: { padding: '10px', fontSize: '13px' },
    tableRow: { display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1.5fr 1.5fr 1fr', padding: '15px', borderBottom: '1px solid #222', alignItems: 'center' },
    emptyState: { padding: '30px', textAlign: 'center', color: '#aaa' },
    actionBtn: { backgroundColor: '#25D366', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }
  };

  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#E50914', marginBottom: '20px' }}>Reengajamento de Clientes (15+ dias)</h2>
      
      <div style={localStyles.configCard}>
        <h3 style={localStyles.formSectionTitle}>Template da Mensagem</h3>
        <p style={localStyles.description}>A mensagem será preparada e você só precisará clicar em enviar no WhatsApp. Use <strong>{'{nome}'}</strong> para o nome do cliente.</p>
        <textarea 
          style={localStyles.textarea}
          value={messageTemplate}
          onChange={(e) => setMessageTemplate(e.target.value)}
          rows={3}
        />
      </div>

      <div style={localStyles.table}>
        <div style={localStyles.tableHeader}>
          <div style={localStyles.tableCell}>Cliente</div>
          {!isMobile && <div style={localStyles.tableCell}>Último Agendamento</div>}
          <div style={localStyles.tableCell}>Dias Inativo</div>
          <div style={localStyles.tableCell}>Ação</div>
        </div>
        {loading ? (
          <div style={localStyles.emptyState}>Carregando clientes...</div>
        ) : inactiveClients.length === 0 ? (
          <div style={localStyles.emptyState}>Nenhum cliente inativo há mais de 15 dias.</div>
        ) : (
          inactiveClients.map((client, index) => (
            <div key={index} style={localStyles.tableRow}>
              <div style={localStyles.tableCell}>
                <strong>{client.client_name}</strong>  
                <br />
                <span style={{fontSize: '11px', color: '#aaa'}}>{client.phone}</span>
              </div>
              {!isMobile && <div style={localStyles.tableCell}>{new Date(client.last_date).toLocaleDateString('pt-BR')}</div>}
              <div style={localStyles.tableCell}>{Math.floor(client.days_inactive)} dias</div>
              <div style={localStyles.tableCell}>
                <button 
                  style={localStyles.actionBtn}
                  onClick={() => openWhatsApp(client)}
                >
                  Enviar Zap
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tenantName, setTenantName] = useState('');
  
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [revenueStats, setRevenueStats] = useState({ 
    today: 0, 
    thisWeek: 0, 
    thisMonth: 0,
    expectedToday: 0,
    expectedWeek: 0,
    expectedMonth: 0 
  });
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [notification, setNotification] = useState({ message: '', type: '', visible: false });
  
  const [showBarberForm, setShowBarberForm] = useState(false);
  const [isEditingBarber, setIsEditingBarber] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [barberForm, setBarberForm] = useState({ id: null, name: '', phone: '', email: '', password: '', specialty: '', photo_url: '', commission_percentage: 0 });
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', price: 0, duration: 0 });
  
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [editSettings, setEditSettings] = useState({});
  const [uploadLoading, setUploadLoading] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState([]);

  const [isMobile, setIsMobile] = useState(false);
  const [performance, setPerformance] = useState([]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function showNotification(message, type = 'success') {
    setNotification({ message, type, visible: true });
    setTimeout(() => {
      setNotification({ message: '', type: '', visible: false });
    }, 4000);
  }

  async function apiCall(url, options = {}) {
    try {
      const token = localStorage.getItem('token');
      
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers['Authorization'] = 'Bearer ' + token;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.clear();
          window.location.href = '/login';
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        
        let errorMessage = `Erro ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error) errorMessage = errorData.error;
        } catch (e) {}
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro na requisição:', error);
      throw error;
    }
  }

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userData);
    setUser(user);
    setTenantName(localStorage.getItem('tenant_name') || 'Barbearia');

    fetchServices();
    fetchBarbers();
    fetchAppointments();
    fetchSettings();
    fetchRevenueStats();
    fetchPerformance();
  }, []);

  async function fetchServices() {
    try {
      setLoading(true);
      const tenantId = localStorage.getItem('tenant_id') || 1;
      const data = await apiCall(`/api/services?tenant_id=${tenantId}`);
      setServices(data.data || []);
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      showNotification('Erro ao buscar serviços', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function fetchBarbers() {
    try {
      const tenantId = localStorage.getItem('tenant_id') || 1;
      const data = await apiCall(`/api/barbers?tenant_id=${tenantId}`);
      setBarbers(data.data || []);
    } catch (error) {
      console.error('Erro ao buscar barbeiros:', error);
      showNotification('Erro ao buscar barbeiros', 'error');
    }
  }

  async function fetchAppointments() {
    try {
      const tenantId = localStorage.getItem('tenant_id') || 1;
      // cache: no-store garante que sempre busca do banco, nunca do cache
      const response = await fetch(`/api/appointments?tenant_id=${tenantId}&t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
        }
      });
      const data = await response.json();
      setAppointments(data.data || []);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      showNotification('Erro ao buscar agendamentos', 'error');
    }
  }

  async function fetchPerformance() {
    try {
      const tenantId = localStorage.getItem('tenant_id') || 1;
      const data = await apiCall(`/api/admin/performance?tenant_id=${tenantId}`);
      if (data.success) setPerformance(data.data || []);
    } catch (error) {
      console.error('Erro ao buscar performance:', error);
    }
  }

  async function fetchRevenueStats() {
    try {
      const tenantId = localStorage.getItem('tenant_id') || 1;
      const data = await apiCall(`/api/admin/revenue-stats?tenant_id=${tenantId}`);
      if (data.success) {
        setRevenueStats(data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar faturamento:', error);
    }
  }

  async function handleStatusChange(appointmentId, newStatus) {
    try {
      const tenantId = parseInt(localStorage.getItem('tenant_id') || '1');
      const response = await apiCall('/api/appointments/status', {
        method: 'PATCH',
        body: JSON.stringify({
          id: parseInt(appointmentId),
          status: newStatus,
          tenant_id: tenantId
        })
      });

      if (response.success) {
        // Atualiza o estado local imediatamente para feedback visual instantâneo
        setAppointments(prev => prev.map(apt =>
          String(apt.id) === String(appointmentId) ? { ...apt, status: newStatus } : apt
        ));
        showNotification('Status atualizado com sucesso!');
        // Busca do banco sem cache para garantir dados atualizados
        await fetchAppointments();
        fetchRevenueStats();
      } else {
        showNotification(response.error || 'Erro ao atualizar status', 'error');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      showNotification('Erro ao atualizar status: ' + error.message, 'error');
    }
  }

  async function fetchSettings() {
    try {
      const tenantId = localStorage.getItem('tenant_id') || 1;
      const data = await apiCall('/api/public/settings?tenant_id=' + tenantId);
      if (data.success) {
        setSettings(data.data || {});
        setEditSettings({
          ...data.data,
          logoUrl: data.data.logo_url,
          bannerUrl: data.data.banner_url,
          instagramUrl: data.data.instagram_url,
          primaryColor: data.data.primary_color,
          secondaryColor: data.data.secondary_color,
          accentColor: data.data.accent_color,
          openingHours: data.data.opening_hours,
          appointmentInterval: data.data.appointment_interval,
          zipCode: data.data.zip_code,
          openingTime: data.data.opening_time,
          closingTime: data.data.closing_time,
        });
      }

      const galleryResponse = await apiCall('/api/public/gallery?tenant_id=' + tenantId);
      setGalleryPhotos(galleryResponse.data || []);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    }
  }

  async function handleCreateBarber(e) {
    e.preventDefault();
    try {
      setLoading(true);
      const tenantId = localStorage.getItem('tenant_id') || 1;
      
      const url = isEditingBarber ? `/api/barbers?id=${barberForm.id}` : '/api/barbers';
      const method = isEditingBarber ? 'PUT' : 'POST';

      await apiCall(url, {
        method,
        body: JSON.stringify({
          ...barberForm,
          tenant_id: tenantId
        }),
      });

      showNotification(`Barbeiro ${isEditingBarber ? 'atualizado' : 'criado'} com sucesso!`, 'success');
      setBarberForm({ id: null, name: '', phone: '', email: '', password: '', specialty: '', photo_url: '', commission_percentage: 0 });
      setShowBarberForm(false);
      setIsEditingBarber(false);
      fetchBarbers();
    } catch (error) {
      console.error('Erro:', error);
      showNotification(error.message || 'Erro ao processar barbeiro', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleEditBarber(barber) {
    setBarberForm({
      id: barber.id,
      name: barber.name,
      phone: barber.phone || '',
      email: barber.email || '',
      password: '', 
      specialty: barber.specialty || '',
      photo_url: barber.photo_url || '',
      commission_percentage: barber.commission_percentage || 0
    });
    setIsEditingBarber(true);
    setShowBarberForm(true);
    setActiveTab('barbers');
  }

  async function handleCreateService(e) {
    e.preventDefault();
    try {
      setLoading(true);
      const tenantId = localStorage.getItem('tenant_id') || 1;

      await apiCall('/api/services', {
        method: 'POST',
        body: JSON.stringify({
          ...serviceForm,
          tenant_id: tenantId,
        }),
      });

      showNotification('Serviço criado com sucesso!', 'success');
      setServiceForm({ name: '', description: '', price: 0, duration: 0 });
      setShowServiceForm(false);
      fetchServices();
    } catch (error) {
      console.error('Erro:', error);
      showNotification(error.message || 'Erro ao criar serviço', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteBarber(id) {
    if (!confirm('Tem certeza que deseja deletar este barbeiro?')) return;
    try {
      await apiCall('/api/barbers?id=' + id, {
        method: 'DELETE',
      });
      showNotification('Barbeiro deletado!', 'success');
      fetchBarbers();
    } catch (error) {
      showNotification('Erro ao deletar barbeiro', 'error');
    }
  }

  async function handleDeleteService(id) {
    if (!confirm('Tem certeza que deseja deletar este serviço?')) return;
    try {
      await apiCall('/api/services?id=' + id, {
        method: 'DELETE',
      });
      showNotification('Serviço deletado!', 'success');
      fetchServices();
    } catch (error) {
      showNotification('Erro ao deletar serviço', 'error');
    }
  }

  async function handleFileUpload(e, type) {
    const file = e.target.files[0];
    if (!file) return;

    setUploadLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
        },
        body: formData,
      });

      const data = await response.json();
      const fileUrl = data.url || data.image_url;

      if (!fileUrl) throw new Error('URL do arquivo não retornada');

      if (type === 'gallery') {
        setGalleryPhotos([...galleryPhotos, data]);
      } else if (type === 'banner') {
        setEditSettings({ ...editSettings, bannerUrl: fileUrl });
      } else if (type === 'logo') {
        setEditSettings({ ...editSettings, logoUrl: fileUrl });
      } else if (type === 'barber') {
        setBarberForm({ ...barberForm, photo_url: fileUrl });
      }

      showNotification('Upload com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      showNotification('Erro ao fazer upload: ' + error.message, 'error');
    } finally {
      setUploadLoading(false);
    }
  }

  async function handleDeletePhoto(photoId) {
    if (!confirm('Tem certeza que deseja deletar esta foto?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload?id=' + photoId, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token },
      });
      const result = await response.json();
      if (result.success) {
        showNotification('Foto deletada!', 'success');
        setGalleryPhotos(galleryPhotos.filter(photo => photo.id !== photoId));
      }
    } catch (error) {
      showNotification('Erro ao deletar foto', 'error');
    }
  }

  async function handleSaveSettings(e) {
    e.preventDefault();
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token'),
        },
        body: JSON.stringify({
          tenantId: parseInt(localStorage.getItem('tenant_id') || '1'),
          name: editSettings.name,
          phone: editSettings.phone,
          logoUrl: editSettings.logoUrl,
          bannerUrl: editSettings.bannerUrl,
          instagramUrl: editSettings.instagramUrl,
          primaryColor: editSettings.primaryColor,
          secondaryColor: editSettings.secondaryColor, 
          accentColor: editSettings.accentColor, 
          description: editSettings.description,
          address: editSettings.address,
          openingHours: editSettings.openingHours, 
          appointmentInterval: editSettings.appointmentInterval, 
          email: editSettings.email, 
          city: editSettings.city, 
          state: editSettings.state, 
          zipCode: editSettings.zipCode, 
          openingTime: editSettings.openingTime, 
          closingTime: editSettings.closingTime, 
        }),
      });

      const result = await response.json();

      if (result.success) {
        showNotification('Configurações salvas com sucesso!', 'success');
        setIsEditingSettings(false);
        fetchSettings(); 
      } else {
        showNotification(result.error || 'Erro ao salvar configurações', 'error');
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      showNotification('Erro ao salvar configurações: ' + error.message, 'error');
    }
  }

  if (!user) {
    return <div style={styles.loading}>Carregando...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={{...styles.header, padding: isMobile ? '15px' : '20px', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '15px' : '0'}}>
        <h1 style={{...styles.title, fontSize: isMobile ? '20px' : '28px'}}>Admin Dashboard - {tenantName}</h1>
        <div style={styles.headerRight}>
          {user && <span style={styles.user}>Olá, {user.name}</span>}
          <button onClick={() => {
            localStorage.clear();
            router.push('/login');
          }} style={{...styles.logoutBtn, padding: isMobile ? '6px 12px' : '8px 16px', fontSize: isMobile ? '12px' : '14px'}}>Sair</button>
        </div>
      </div>

      {notification.visible && (
        <div style={{
          ...styles.notification,
          backgroundColor: notification.type === 'success' ? '#d4edda' : '#f8d7da',
          color: notification.type === 'success' ? '#155724' : '#721c24',
          top: isMobile ? '10px' : '20px',
          right: isMobile ? '10px' : '20px',
          left: isMobile ? '10px' : 'auto',
          fontSize: isMobile ? '12px' : '14px'
        }}>
          {notification.message}
        </div>
      )}

      <div style={{...styles.main, flexDirection: isMobile ? 'column' : 'row'}}>
        <div style={{...styles.sidebar, width: isMobile ? '100%' : '200px', display: isMobile && !isSidebarOpen ? 'none' : 'block'}}>
          <div 
            style={{
              ...styles.sidebarItem,
              borderLeftColor: activeTab === 'dashboard' ? '#E50914' : 'transparent',
              color: activeTab === 'dashboard' ? '#E50914' : '#aaa',
              backgroundColor: activeTab === 'dashboard' ? '#1a1a1a' : 'transparent'
            }}
            onClick={() => { setActiveTab('dashboard'); if (isMobile) setIsSidebarOpen(false); }}
          >
            Dashboard
          </div>
          <div
            style={{
              ...styles.sidebarItem,
              borderLeftColor: activeTab === 'barbers' ? '#E50914' : 'transparent',
              color: activeTab === 'barbers' ? '#E50914' : '#aaa',
              backgroundColor: activeTab === 'barbers' ? '#1a1a1a' : 'transparent'
            }}
            onClick={() => { setActiveTab('barbers'); if (isMobile) setIsSidebarOpen(false); }}
          >
            Barbeiros
          </div>
          <div
            style={{
              ...styles.sidebarItem,
              borderLeftColor: activeTab === 'services' ? '#E50914' : 'transparent',
              color: activeTab === 'services' ? '#E50914' : '#aaa',
              backgroundColor: activeTab === 'services' ? '#1a1a1a' : 'transparent'
            }}
            onClick={() => { setActiveTab('services'); if (isMobile) setIsSidebarOpen(false); }}
          >
            Serviços
          </div>
          <div
            style={{
              ...styles.sidebarItem,
              borderLeftColor: activeTab === 'appointments' ? '#E50914' : 'transparent',
              color: activeTab === 'appointments' ? '#E50914' : '#aaa',
              backgroundColor: activeTab === 'appointments' ? '#1a1a1a' : 'transparent'
            }}
            onClick={() => { setActiveTab('appointments'); if (isMobile) setIsSidebarOpen(false); }}
          >
            Agendamentos
          </div>
          <div
            style={{
              ...styles.sidebarItem,
              borderLeftColor: activeTab === 'settings' ? '#E50914' : 'transparent',
              color: activeTab === 'settings' ? '#E50914' : '#aaa',
              backgroundColor: activeTab === 'settings' ? '#1a1a1a' : 'transparent'
            }}
            onClick={() => { setActiveTab('settings'); if (isMobile) setIsSidebarOpen(false); }}
          >
            Configurações
          </div>
          <div
            style={{
              ...styles.sidebarItem,
              borderLeftColor: activeTab === 'gallery' ? '#E50914' : 'transparent',
              color: activeTab === 'gallery' ? '#E50914' : '#aaa',
              backgroundColor: activeTab === 'gallery' ? '#1a1a1a' : 'transparent'
            }}
            onClick={() => { setActiveTab('gallery'); if (isMobile) setIsSidebarOpen(false); }}
          >
            Galeria
          </div>
          <div
            style={{
              ...styles.sidebarItem,
              borderLeftColor: activeTab === 'reengagement' ? '#E50914' : 'transparent',
              color: activeTab === 'reengagement' ? '#E50914' : '#aaa',
              backgroundColor: activeTab === 'reengagement' ? '#1a1a1a' : 'transparent'
            }}
            onClick={() => { setActiveTab('reengagement'); if (isMobile) setIsSidebarOpen(false); }}
          >
            Reengajamento
          </div>
          <div
            style={{
              ...styles.sidebarItem,
              borderLeftColor: activeTab === 'performance' ? '#E50914' : 'transparent',
              color: activeTab === 'performance' ? '#E50914' : '#aaa',
              backgroundColor: activeTab === 'performance' ? '#1a1a1a' : 'transparent'
            }}
            onClick={() => { setActiveTab('performance'); if (isMobile) setIsSidebarOpen(false); }}
          >
            Performance
          </div>
        </div>

        {isMobile && (
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{
              backgroundColor: '#111',
              color: '#E50914',
              border: 'none',
              padding: '10px',
              fontWeight: 'bold',
              width: '100%',
              borderBottom: '1px solid #222'
            }}
          >
            {isSidebarOpen ? 'FECHAR MENU' : 'ABRIR MENU'}
          </button>
        )}

        <main style={{...styles.content, padding: isMobile ? '15px' : '30px'}}>
          {activeTab === 'dashboard' && (
            <div>
              <h2 style={styles.sectionTitle}>Dashboard</h2>
              
              <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '8px', marginTop: '0' }}>Faturamento Realizado (agendamentos confirmados)</p>
              <div style={{...styles.revenueGrid, gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)'}}>
                <div style={{ ...styles.revenueCard, borderLeftColor: '#E50914' }}>
                  <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '10px' }}>Faturamento Hoje</p>
                  <p style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 'bold', color: '#E50914' }}>R$ {(revenueStats.today || 0).toFixed(2)}</p>
                </div>
                <div style={{ ...styles.revenueCard, borderLeftColor: '#007bff' }}>
                  <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '10px' }}>Faturamento Semana</p>
                  <p style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 'bold', color: '#007bff' }}>R$ {(revenueStats.thisWeek || 0).toFixed(2)}</p>
                </div>
                <div style={{ ...styles.revenueCard, borderLeftColor: '#28a745' }}>
                  <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '10px' }}>Faturamento Mês</p>
                  <p style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 'bold', color: '#28a745' }}>R$ {(revenueStats.thisMonth || 0).toFixed(2)}</p>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '8px', marginTop: '20px' }}>Expectativa de Faturamento (pendentes + confirmados)</p>
              <div style={{...styles.revenueGrid, gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)'}}>
                <div style={{ ...styles.revenueCard, borderLeftColor: '#ff9800' }}>
                  <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '10px' }}>Expectativa Hoje</p>
                  <p style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 'bold', color: '#ff9800' }}>R$ {(revenueStats.expectedToday || 0).toFixed(2)}</p>
                </div>
                <div style={{ ...styles.revenueCard, borderLeftColor: '#9c27b0' }}>
                  <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '10px' }}>Expectativa Semana</p>
                  <p style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 'bold', color: '#9c27b0' }}>R$ {(revenueStats.expectedWeek || 0).toFixed(2)}</p>
                </div>
                <div style={{ ...styles.revenueCard, borderLeftColor: '#00bcd4' }}>
                  <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '10px' }}>Expectativa Mês</p>
                  <p style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 'bold', color: '#00bcd4' }}>R$ {(revenueStats.expectedMonth || 0).toFixed(2)}</p>
                </div>
              </div>

              <div style={{...styles.statsGrid, gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(200px, 1fr))'}}>
                <div style={styles.statCard}>
                  <p style={styles.statLabel}>Total de Barbeiros</p>
                  <p style={{...styles.statValue, fontSize: isMobile ? '24px' : '32px'}}>{barbers.length}</p>
                </div>
                <div style={styles.statCard}>
                  <p style={styles.statLabel}>Total de Serviços</p>
                  <p style={{...styles.statValue, fontSize: isMobile ? '24px' : '32px'}}>{services.length}</p>
                </div>
                <div style={styles.statCard}>
                  <p style={styles.statLabel}>Agendamentos Pendentes</p>
                  <p style={{...styles.statValue, fontSize: isMobile ? '24px' : '32px'}}>
                    {revenueStats.pendingCount ?? appointments.filter(apt => apt.status === 'pending' || apt.status === 'pendente').length}
                  </p>
                </div>
                <div style={styles.statCard}>
                  <p style={styles.statLabel}>Agendamentos Concluídos</p>
                  <p style={{...styles.statValue, fontSize: isMobile ? '24px' : '32px'}}>
                    {revenueStats.completedCount ?? appointments.filter(apt => apt.status === 'completed' || apt.status === 'concluído').length}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'barbers' && (
            <div>
              <h2 style={styles.sectionTitle}>Gerenciar Barbeiros</h2>
              <button onClick={() => {
                if (showBarberForm) {
                  setShowBarberForm(false);
                  setIsEditingBarber(false);
                  setBarberForm({ id: null, name: '', phone: '', email: '', password: '', specialty: '', photo_url: '', commission_percentage: 0 });
                } else {
                  setShowBarberForm(true);
                }
              }} style={styles.addBtn}>
                {showBarberForm ? 'Cancelar' : '+ Adicionar Barbeiro'}
              </button>

              {showBarberForm && (
                <form onSubmit={handleCreateBarber} style={styles.form}>
                  <h3 style={styles.formSectionTitle}>{isEditingBarber ? 'Editar Barbeiro' : 'Novo Barbeiro'}</h3>
                  <input
                    type="text"
                    placeholder="Nome do Barbeiro"
                    value={barberForm.name}
                    onChange={(e) => setBarberForm({ ...barberForm, name: e.target.value })}
                    style={styles.input}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Telefone"
                    value={barberForm.phone}
                    onChange={(e) => setBarberForm({ ...barberForm, phone: e.target.value })}
                    style={styles.input}
                  />
                  <input
                    type="email"
                    placeholder="Email (para login)"
                    value={barberForm.email}
                    onChange={(e) => setBarberForm({ ...barberForm, email: e.target.value })}
                    style={styles.input}
                    required
                  />
                  <input
                    type="password"
                    placeholder={isEditingBarber ? "Nova senha (deixe em branco para manter)" : "Senha (mínimo 6 caracteres)"}
                    value={barberForm.password}
                    onChange={(e) => setBarberForm({ ...barberForm, password: e.target.value })}
                    style={styles.input}
                    required={!isEditingBarber}
                  />
                  <input
                    type="text"
                    placeholder="Especialidade"
                    value={barberForm.specialty}
                    onChange={(e) => setBarberForm({ ...barberForm, specialty: e.target.value })}
                    style={styles.input}
                  />
                  <input
                    type="number"
                    placeholder="Percentual de Comissão (%)"
                    value={barberForm.commission_percentage}
                    onChange={(e) => setBarberForm({ ...barberForm, commission_percentage: parseFloat(e.target.value) })}
                    style={styles.input}
                  />

                  <div style={styles.uploadBox}>
                    <label style={styles.uploadLabel}>Foto do Barbeiro</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'barber')}
                      style={styles.fileInput}
                      disabled={uploadLoading}
                    />
                    {barberForm.photo_url && (
                      <div style={styles.photoPreviewContainer}>
                        <img src={barberForm.photo_url} alt="Preview" style={styles.photoPreview} />
                        <br />
                        <button 
                          type="button" 
                          onClick={() => setBarberForm({...barberForm, photo_url: ''})}
                          style={styles.removePhotoBtn}
                        >
                          Remover Foto
                        </button>
                      </div>
                    )}
                  </div>

                  <button type="submit" style={styles.submitBtn} disabled={loading || uploadLoading}>
                    {loading ? 'Salvando...' : isEditingBarber ? 'Atualizar Barbeiro' : 'Salvar Barbeiro'}
                  </button>
                </form>
              )}

              <div style={styles.table}>
                {barbers.length === 0 ? (
                  <p style={styles.emptyState}>Nenhum barbeiro cadastrado</p>
                ) : (
                  <>
                    <div style={{...styles.tableHeader, gridTemplateColumns: isMobile ? '1.5fr 1fr' : '0.5fr 1.5fr 1fr 1fr 1fr'}}>
                      {!isMobile && <div style={styles.tableCell}>Foto</div>}
                      <div style={styles.tableCell}>Nome</div>
                      {!isMobile && <div style={styles.tableCell}>Telefone</div>}
                      {!isMobile && <div style={styles.tableCell}>Comissão</div>}
                      <div style={styles.tableCell}>Ações</div>
                    </div>
                    {barbers.map((barber) => (
                      <div key={barber.id} style={{...styles.tableRow, gridTemplateColumns: isMobile ? '1.5fr 1fr' : '0.5fr 1.5fr 1fr 1fr 1fr'}}>
                        {!isMobile && (
                          <div style={styles.tableCell}>
                            <img 
                              src={barber.photo_url || 'https://via.placeholder.com/40'} 
                              alt={barber.name} 
                              style={{width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover'}}
                            />
                          </div>
                        )}
                        <div style={styles.tableCell}>
                          <strong>{barber.name}</strong>
                          {isMobile && <div style={{fontSize: '11px', color: '#aaa'}}>{barber.phone}</div>}
                        </div>
                        {!isMobile && <div style={styles.tableCell}>{barber.phone}</div>}
                        {!isMobile && <div style={styles.tableCell}>{barber.commission_percentage}%</div>}
                        <div style={{...styles.tableCell, display: 'flex', gap: '5px'}}>
                          <button onClick={() => handleEditBarber(barber)} style={{...styles.deleteBtn, backgroundColor: '#007bff'}}>Editar</button>
                          <button onClick={() => handleDeleteBarber(barber.id)} style={styles.deleteBtn}>Sair</button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div>
              <h2 style={styles.sectionTitle}>Gerenciar Serviços</h2>
              <button onClick={() => setShowServiceForm(!showServiceForm)} style={styles.addBtn}>
                {showServiceForm ? 'Cancelar' : '+ Adicionar Serviço'}
              </button>

              {showServiceForm && (
                <form onSubmit={handleCreateService} style={styles.form}>
                  <input
                    type="text"
                    placeholder="Nome do Serviço"
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                    style={styles.input}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Descrição"
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                    style={styles.input}
                  />
                  <input
                    type="number"
                    placeholder="Preço"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) })}
                    style={styles.input}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Duração (minutos)"
                    value={serviceForm.duration}
                    onChange={(e) => setServiceForm({ ...serviceForm, duration: parseInt(e.target.value) })}
                    style={styles.input}
                    required
                  />
                  <button type="submit" style={styles.submitBtn} disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar Serviço'}
                  </button>
                </form>
              )}

              <div style={styles.table}>
                {services.length === 0 ? (
                  <p style={styles.emptyState}>Nenhum serviço cadastrado</p>
                ) : (
                  <>
                    <div style={{...styles.tableHeader, gridTemplateColumns: isMobile ? '1.5fr 1fr' : '1.5fr 2fr 1fr 1fr 0.8fr'}}>
                      <div style={styles.tableCell}>Serviço</div>
                      {!isMobile && <div style={styles.tableCell}>Descrição</div>}
                      <div style={styles.tableCell}>Preço</div>
                      {!isMobile && <div style={styles.tableCell}>Duração</div>}
                      <div style={styles.tableCell}>Ações</div>
                    </div>
                    {services.map((service) => (
                      <div key={service.id} style={{...styles.tableRow, gridTemplateColumns: isMobile ? '1.5fr 1fr' : '1.5fr 2fr 1fr 1fr 0.8fr'}}>
                        <div style={styles.tableCell}><strong>{service.name}</strong></div>
                        {!isMobile && <div style={styles.tableCell}>{service.description || '-'}</div>}
                        <div style={styles.tableCell}>R$ {parseFloat(service.price).toFixed(2)}</div>
                        {!isMobile && <div style={styles.tableCell}>{service.duration} min</div>}
                        <div style={styles.tableCell}>
                          <button onClick={() => handleDeleteService(service.id)} style={styles.deleteBtn}>Deletar</button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'appointments' && (
            <div>
              <h2 style={styles.sectionTitle}>Agendamentos</h2>
              <div style={styles.table}>
                {appointments.length === 0 ? (
                  <p style={styles.emptyState}>Nenhum agendamento encontrado</p>
                ) : (
                  <>
                    <div style={{...styles.tableHeader, gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1.2fr 1.5fr 1fr'}}>
                      <div style={styles.tableCell}>Data/Hora</div>
                      {!isMobile && <div style={styles.tableCell}>Barbeiro</div>}
                      <div style={styles.tableCell}>Cliente</div>
                      {!isMobile && <div style={styles.tableCell}>Serviços</div>}
                      <div style={styles.tableCell}>Status</div>
                    </div>
                    {appointments.map((apt) => (
                      <div key={apt.id} style={{...styles.tableRow, gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1.2fr 1.5fr 1fr'}}>
                        <div style={styles.tableCell}>
                          {new Date(apt.date).toLocaleDateString('pt-BR')}
                          <br />
                          <span style={{color: '#E50914', fontWeight: 'bold'}}>{apt.time}</span>
                        </div>
                        {!isMobile && <div style={styles.tableCell}>{apt.barber_name || 'Não atribuído'}</div>}
                        <div style={styles.tableCell}>
                          <strong>{apt.client_name || 'Cliente'}</strong>
                          <br />
                          <span style={{fontSize: '11px', color: '#aaa'}}>{apt.phone}</span>
                        </div>
                        {!isMobile && <div style={styles.tableCell}>{apt.service_names || apt.service_name || '-'}</div>}
                        <div style={styles.tableCell}>
                          <select 
                            value={({'pendente':'pending','confirmado':'confirmed','concluído':'completed','cancelado':'cancelled'})[apt.status] || apt.status || 'pending'}
                            onChange={(e) => handleStatusChange(apt.id, e.target.value)}
                            style={{
                              padding: '6px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              backgroundColor: 
                                (apt.status === 'confirmed' || apt.status === 'confirmado') ? '#28a745' : 
                                (apt.status === 'pending' || apt.status === 'pendente') ? '#ff9800' : 
                                (apt.status === 'completed' || apt.status === 'concluído') ? '#007bff' : 
                                (apt.status === 'cancelled' || apt.status === 'cancelado') ? '#dc3545' : '#444',
                              color: '#fff',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="pending">PENDENTE</option>
                            <option value="confirmed">CONFIRMADO</option>
                            <option value="completed">CONCLUÍDO</option>
                            <option value="cancelled">CANCELADO</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 style={styles.sectionTitle}>Configurações</h2>
              
              {!isEditingSettings ? (
                <div style={styles.configCard}>
                  <div style={styles.configItem}>
                    <label style={styles.configLabel}>NOME DA BARBEARIA</label>
                    <div style={{fontSize: '18px', fontWeight: 'bold'}}>{settings?.name || 'Não definido'}</div>
                  </div>
                  <div style={styles.configItem}>
                    <label style={styles.configLabel}>TELEFONE</label>
                    <div>{settings?.phone || 'Não definido'}</div>
                  </div>
                  <div style={styles.configItem}>
                    <label style={styles.configLabel}>ENDEREÇO</label>
                    <div>{settings?.address || 'Não definido'}, {settings?.city} - {settings?.state}</div>
                  </div>
                  <div style={styles.configItem}>
                    <label style={styles.configLabel}>HORÁRIO</label>
                    <div>{settings?.opening_time} às {settings?.closing_time} (Intervalo: {settings?.appointment_interval}min)</div>
                  </div>
                  <button onClick={() => setIsEditingSettings(true)} style={styles.addBtn}>Editar Configurações</button>
                </div>
              ) : (
                <div style={styles.form}>
                  <form onSubmit={handleSaveSettings}>
                    <h3 style={styles.formSectionTitle}>Informações Gerais</h3>
                    <input
                      type="text"
                      placeholder="Nome da Barbearia"
                      value={editSettings.name || ""}
                      onChange={(e) =>
                        setEditSettings({ ...editSettings, name: e.target.value })
                      }
                      style={styles.input}
                    />
                    <input
                      type="text"
                      placeholder="Telefone"
                      value={editSettings.phone || ""}
                      onChange={(e) =>
                        setEditSettings({ ...editSettings, phone: e.target.value })
                      }
                      style={styles.input}
                    />
                    <textarea
                      placeholder="Descrição"
                      value={editSettings.description || ""}
                      onChange={(e) =>
                        setEditSettings({ ...editSettings, description: e.target.value })
                      }
                      style={{ ...styles.input, height: "80px", resize: "none" }}
                    />

                    <h3 style={styles.formSectionTitle}>Localização</h3>
                    <input
                      type="text"
                      placeholder="Endereço Completo"
                      value={editSettings.address || ""}
                      onChange={(e) =>
                        setEditSettings({ ...editSettings, address: e.target.value })
                      }
                      style={styles.input}
                    />
                    <input
                      type="text"
                      placeholder="Cidade"
                      value={editSettings.city || ""}
                      onChange={(e) =>
                        setEditSettings({ ...editSettings, city: e.target.value })
                      }
                      style={styles.input}
                    />
                    <input
                      type="text"
                      placeholder="Estado (UF)"
                      value={editSettings.state || ""}
                      onChange={(e) =>
                        setEditSettings({ ...editSettings, state: e.target.value })
                      }
                      style={styles.input}
                    />
                    <input
                      type="text"
                      placeholder="CEP"
                      value={editSettings.zipCode || ""}
                      onChange={(e) =>
                        setEditSettings({ ...editSettings, zipCode: e.target.value })
                      }
                      style={styles.input}
                    />

                    <h3 style={styles.formSectionTitle}>Horários e Agendamento</h3>
                    <input
                      type="text"
                      placeholder="Horário de Abertura (Ex: 09:00)"
                      value={editSettings.openingTime || ""}
                      onChange={(e) =>
                        setEditSettings({ ...editSettings, openingTime: e.target.value })
                      }
                      style={styles.input}
                    />
                    <input
                      type="text"
                      placeholder="Horário de Fechamento (Ex: 18:00)"
                      value={editSettings.closingTime || ""}
                      onChange={(e) =>
                        setEditSettings({ ...editSettings, closingTime: e.target.value })
                      }
                      style={styles.input}
                    />
                    <input
                      type="number"
                      placeholder="Intervalo de Agendamento (minutos)"
                      value={editSettings.appointmentInterval || 30}
                      onChange={(e) =>
                        setEditSettings({ ...editSettings, appointmentInterval: parseInt(e.target.value) })
                      }
                      style={styles.input}
                    />

                    <h3 style={styles.formSectionTitle}>Cores da Marca</h3>
                    <div style={{...styles.colorRow, gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)'}}>
                      <div style={styles.colorGroup}>
                        <label style={styles.label}>Cor Primária</label>
                        <input
                          type="color"
                          value={editSettings.primaryColor || "#E50914"}
                          onChange={(e) =>
                            setEditSettings({ ...editSettings, primaryColor: e.target.value })
                          }
                          style={styles.colorInput}
                        />
                      </div>
                      <div style={styles.colorGroup}>
                        <label style={styles.label}>Cor Secundária</label>
                        <input
                          type="color"
                          value={editSettings.secondaryColor || "#000000"}
                          onChange={(e) =>
                            setEditSettings({ ...editSettings, secondaryColor: e.target.value })
                          }
                          style={styles.colorInput}
                        />
                      </div>
                      <div style={styles.colorGroup}>
                        <label style={styles.label}>Cor de Destaque</label>
                        <input
                          type="color"
                          value={editSettings.accentColor || "#ffffff"}
                          onChange={(e) =>
                            setEditSettings({ ...editSettings, accentColor: e.target.value })
                          }
                          style={styles.colorInput}
                        />
                      </div>
                    </div>

                    <h3 style={styles.formSectionTitle}>Imagens</h3>
                    <div style={{...styles.uploadSection, gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)'}}>
                      <div style={styles.uploadBox}>
                        <label style={styles.uploadLabel}>Logo da Barbearia</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, "logo")}
                          style={styles.fileInput}
                          disabled={uploadLoading}
                        />
                        {editSettings.logoUrl && (
                          <div style={{ marginTop: '10px' }}>
                            <img
                              src={editSettings.logoUrl}
                              alt="Logo"
                              style={styles.uploadPreview}
                            />
                            <button
                              type="button"
                              onClick={() => setEditSettings({ ...editSettings, logoUrl: '' })}
                              style={styles.removeImageBtn}
                            >
                              ✕ Remover Logo
                            </button>
                          </div>
                        )}
                      </div>
                      <div style={styles.uploadBox}>
                        <label style={styles.uploadLabel}>Banner da Barbearia</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, "banner")}
                          style={styles.fileInput}
                          disabled={uploadLoading}
                        />
                        {editSettings.bannerUrl && (
                          <div style={{ marginTop: '10px' }}>
                            <img
                              src={editSettings.bannerUrl}
                              alt="Banner"
                              style={styles.uploadPreview}
                            />
                            <button
                              type="button"
                              onClick={() => setEditSettings({ ...editSettings, bannerUrl: '' })}
                              style={styles.removeImageBtn}
                            >
                              ✕ Remover Banner
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      style={styles.submitBtn}
                      disabled={loading || uploadLoading}
                    >
                      {loading ? "Salvando..." : "Salvar Configurações"}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsEditingSettings(false)}
                      style={{...styles.submitBtn, backgroundColor: '#444', marginTop: '10px'}}
                    >
                      Cancelar
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {activeTab === "gallery" && (
            <div>
              <h2 style={styles.sectionTitle}>Galeria de Fotos</h2>
              <div style={styles.uploadBox}>
                <label style={styles.uploadLabel}>Adicionar Foto à Galeria</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, "gallery")}
                  style={styles.fileInput}
                  disabled={uploadLoading}
                />
              </div>
              <div style={styles.galleryPreview}>
                <h3 style={styles.galleryTitle}>Fotos Atuais</h3>
                {galleryPhotos.length === 0 ? (
                  <p style={styles.emptyState}>Nenhuma foto na galeria.</p>
                ) : (
                  <div style={{...styles.galleryGrid, gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(150px, 1fr))'}}>
                    {galleryPhotos.map((photo) => (
                      <div key={photo.id} style={styles.galleryItemContainer}>
                        <img
                          src={photo.image_url || photo.url}
                          alt="Galeria"
                          style={styles.galleryItemImage}
                        />
                        <button
                          onClick={() => handleDeletePhoto(photo.id)}
                          style={styles.removePhotoBtn}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "reengagement" && (
            <ReengagementTab 
              tenantId={localStorage.getItem('tenant_id') || 1}
              apiCall={apiCall}
              showNotification={showNotification}
              isMobile={isMobile}
            />
          )}

          {activeTab === "performance" && (
            <div>
              <h2 style={styles.sectionTitle}>Performance dos Barbeiros</h2>
              <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '20px' }}>Resumo geral de todos os barbeiros da barbearia.</p>
              {performance.length === 0 ? (
                <p style={styles.emptyState}>Nenhum dado de performance disponível.</p>
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {performance.map((b, i) => (
                    <div key={b.barber_id} style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px', padding: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#E50914', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px' }}>
                          {i + 1}
                        </div>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{b.barber_name}</div>
                          <div style={{ fontSize: '12px', color: '#aaa' }}>Comissão: {b.commission_percentage || 0}%</div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '12px' }}>
                        <div style={{ backgroundColor: '#1a1a1a', borderRadius: '6px', padding: '12px', textAlign: 'center' }}>
                          <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>Total Agend.</div>
                          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#E50914' }}>{b.total_appointments}</div>
                        </div>
                        <div style={{ backgroundColor: '#1a1a1a', borderRadius: '6px', padding: '12px', textAlign: 'center' }}>
                          <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>Concluídos</div>
                          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#28a745' }}>{b.completed}</div>
                        </div>
                        <div style={{ backgroundColor: '#1a1a1a', borderRadius: '6px', padding: '12px', textAlign: 'center' }}>
                          <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>Faturamento</div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#007bff' }}>R$ {parseFloat(b.total_revenue || 0).toFixed(2)}</div>
                        </div>
                        <div style={{ backgroundColor: '#1a1a1a', borderRadius: '6px', padding: '12px', textAlign: 'center' }}>
                          <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>Comissão</div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff9800' }}>R$ {parseFloat(b.commission_value || 0).toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'Arial, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', borderBottom: '1px solid #222' },
  title: { fontWeight: 'bold', color: '#E50914', margin: 0 },
  headerRight: { display: 'flex', alignItems: 'center', gap: '20px' },
  user: { fontSize: '14px', color: '#aaa' },
  logoutBtn: { backgroundColor: '#E50914', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  notification: { padding: '15px', borderRadius: '4px', fontWeight: 'bold', position: 'fixed', zIndex: 1000 },
  main: { display: 'flex', minHeight: 'calc(100vh - 80px)' },
  sidebar: { backgroundColor: '#111', borderRight: '1px solid #222', padding: '20px 0' },
  sidebarItem: { padding: '15px 20px', cursor: 'pointer', borderLeft: '3px solid transparent', fontSize: '14px', transition: 'all 0.3s' },
  content: { flex: 1, overflowY: 'auto' },
  sectionTitle: { fontSize: '24px', fontWeight: 'bold', color: '#E50914', marginBottom: '20px' },
  revenueGrid: { display: 'grid', gap: '20px', marginBottom: '30px' },
  revenueCard: { backgroundColor: '#111', padding: '20px', borderRadius: '8px', borderLeft: '4px solid' },
  addBtn: { backgroundColor: '#E50914', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '20px' },
  form: { backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px', padding: '20px', marginBottom: '20px' },
  formSectionTitle: { fontSize: '16px', fontWeight: 'bold', color: '#E50914', marginBottom: '15px', marginTop: '20px' },
  input: { width: '100%', padding: '10px', marginBottom: '10px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', color: '#fff', boxSizing: 'border-box' },
  submitBtn: { width: '100%', padding: '12px', backgroundColor: '#E50914', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
  table: { backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px', overflow: 'hidden' },
  tableHeader: { display: 'grid', padding: '15px', backgroundColor: '#1a1a1a', borderBottom: '1px solid #222', fontWeight: 'bold' },
  tableCell: { padding: '10px', fontSize: '13px' },
  tableRow: { display: 'grid', padding: '15px', borderBottom: '1px solid #222', alignItems: 'center' },
  emptyState: { padding: '30px', textAlign: 'center', color: '#aaa' },
  deleteBtn: { backgroundColor: '#FF6B6B', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  statsGrid: { display: 'grid', gap: '20px' },
  statCard: { backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px', padding: '20px', textAlign: 'center' },
  statLabel: { fontSize: '14px', color: '#aaa', marginBottom: '10px' },
  statValue: { fontWeight: 'bold', color: '#E50914' },
  configCard: { backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px', padding: '30px', marginBottom: '20px' },
  configItem: { marginBottom: '20px' },
  configLabel: { fontSize: '12px', fontWeight: '500', color: '#E50914', display: 'block', marginBottom: '5px' },
  label: { fontSize: '12px', fontWeight: '500', color: '#E50914' },
  colorRow: { display: 'grid', gap: '20px', marginBottom: '20px' },
  colorGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  colorInput: { width: '100%', height: '40px', border: '1px solid #333', borderRadius: '4px', cursor: 'pointer' },
  uploadSection: { display: 'grid', gap: '20px', marginBottom: '20px' },
  uploadBox: { backgroundColor: '#1a1a1a', border: '2px dashed #333', borderRadius: '8px', padding: '20px', textAlign: 'center' },
  uploadLabel: { fontSize: '12px', fontWeight: '500', color: '#E50914', display: 'block', marginBottom: '10px' },
  fileInput: { display: 'block', width: '100%', marginBottom: '10px', color: '#aaa' },
  uploadPreview: { maxWidth: '100%', maxHeight: '100px', borderRadius: '4px', display: 'block' },
  removeImageBtn: { display: 'block', width: '100%', marginTop: '8px', backgroundColor: '#c0392b', color: '#fff', border: 'none', borderRadius: '4px', padding: '7px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' },
  photoPreviewContainer: { marginTop: '15px', textAlign: 'center' },
  photoPreview: { maxWidth: '100%', maxHeight: '150px', borderRadius: '8px', marginBottom: '10px', border: '2px solid #E50914' },
  removePhotoBtn: { backgroundColor: '#FF6B6B', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' },
  galleryPreview: { marginTop: '30px' },
  galleryTitle: { fontSize: '14px', fontWeight: 'bold', color: '#E50914', marginBottom: '15px' },
  galleryGrid: { display: 'grid', gap: '15px' },
  galleryItemContainer: { position: 'relative', borderRadius: '8px', overflow: 'hidden' },
  galleryItemImage: { width: '100%', height: '150px', objectFit: 'cover' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#000', color: '#E50914', fontSize: '18px' },
};