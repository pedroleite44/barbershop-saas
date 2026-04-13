'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tenantName, setTenantName] = useState('');
  
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [revenueStats, setRevenueStats] = useState({ today: 0, thisWeek: 0, thisMonth: 0 });
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [notification, setNotification] = useState({ message: '', type: '', visible: false });
  
  const [showBarberForm, setShowBarberForm] = useState(false);
  const [isEditingBarber, setIsEditingBarber] = useState(false); // ✅ ADICIONADO
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [barberForm, setBarberForm] = useState({ id: null, name: '', phone: '', email: '', password: '', specialty: '', photo_url: '', commission_percentage: 0 }); // ✅ ATUALIZADO
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', price: 0, duration: 0 });
  
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [editSettings, setEditSettings] = useState({});
  const [uploadLoading, setUploadLoading] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState([]);

  // ✅ NOVO: Estado para detectar mobile e ajustar layout
  const [isMobile, setIsMobile] = useState(false);

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
      // ✅ ATUALIZADO: Agora a rota /api/barbers retorna e-mails
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
      const data = await apiCall(`/api/appointments?tenant_id=${tenantId}`);
      setAppointments(data.data || []);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      showNotification('Erro ao buscar agendamentos', 'error');
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

  async function fetchSettings() {
    try {
      const tenantId = localStorage.getItem('tenant_id') || 1;
      const data = await apiCall('/api/public/settings?tenant_id=' + tenantId);
      if (data.success) {
        setSettings(data.data || {});
        // Mapeia snake_case do backend para camelCase do frontend para editSettings
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
      } else {
        console.error("Erro ao buscar configurações iniciais:", data.error);
      }

      const galleryResponse = await apiCall('/api/public/gallery?tenant_id=' + tenantId);
      setGalleryPhotos(galleryResponse.data || []);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    }
  }

  async function handleCreateBarber(e) {
    e.preventDefault();
    // ✅ ATUALIZADO: Senha opcional na edição
    if (!barberForm.name || !barberForm.phone || !barberForm.email || (!isEditingBarber && !barberForm.password)) {
      showNotification('Preencha todos os campos obrigatórios', 'error');
      return;
    }
    if (!isEditingBarber && barberForm.password.length < 6) {
      showNotification('A senha deve ter no mínimo 6 caracteres', 'error');
      return;
    }

    try {
      setLoading(true);
      const tenantId = localStorage.getItem('tenant_id') || 1;
      
      if (isEditingBarber) {
        // ✅ NOVO: Chamada para atualização
        await apiCall('/api/barbers', {
          method: 'PUT',
          body: JSON.stringify(barberForm),
        });
        showNotification('Barbeiro atualizado com sucesso!', 'success');
      } else {
        await apiCall('/api/barbers', {
          method: 'POST',
          body: JSON.stringify({
            ...barberForm,
            tenant_id: tenantId
          }),
        });
        showNotification('Barbeiro criado com sucesso!', 'success');
      }

      setBarberForm({ id: null, name: '', phone: '', email: '', password: '', specialty: '', photo_url: '', commission_percentage: 0 });
      setShowBarberForm(false);
      setIsEditingBarber(false);
      fetchBarbers();
    } catch (error) {
      console.error('Erro:', error);
      showNotification(error.message || 'Erro ao salvar barbeiro', 'error');
    } finally {
      setLoading(false);
    }
  }

  // ✅ NOVO: Função para carregar edição
  function handleEditBarber(barber) {
    setBarberForm({
      id: barber.id,
      name: barber.name,
      phone: barber.phone,
      email: barber.email, 
      password: '', 
      specialty: barber.specialty,
      photo_url: barber.photo_url,
      commission_percentage: barber.commission_percentage
    });
    setIsEditingBarber(true);
    setShowBarberForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleCreateService(e) {
    e.preventDefault();
    if (!serviceForm.name || serviceForm.price <= 0 || serviceForm.duration <= 0) {
      showNotification('Preencha todos os campos corretamente', 'error');
      return;
    }

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

      if (!fileUrl) {
        throw new Error('URL do arquivo não retornada pela API');
      }

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
        headers: {
          'Authorization': 'Bearer ' + token,
        },
      });

      if (response.ok) {
        setGalleryPhotos(galleryPhotos.filter((p) => p.id !== photoId));
        showNotification('Foto deletada com sucesso!', 'success');
      }
    } catch (error) {
      console.error('Erro ao deletar foto:', error);
      showNotification('Erro ao deletar foto', 'error');
    }
  }

  async function handleSaveSettings(e) {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenant_id') || 1;
      
      if (!token || !tenantId) {
        showNotification('Token ou Tenant ID não encontrado', 'error');
        return;
      }

      const response = await fetch("/api/settings", {
        method: "PUT", 
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
        },
        body: JSON.stringify({
          tenantId: tenantId,
          name: editSettings.name,
          slug: editSettings.slug,
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

  return (
    <div style={styles.container}>
      <div style={{...styles.header, padding: isMobile ? '15px' : '20px'}}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {isMobile && (
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              style={{ background: 'none', border: 'none', color: '#E50914', fontSize: '24px', cursor: 'pointer' }}
            >
              ☰
            </button>
          )}
          <h1 style={{...styles.title, fontSize: isMobile ? '20px' : '28px'}}>Admin Dashboard - {tenantName}</h1>
        </div>
        <div style={styles.headerRight}>
          {!isMobile && user && <span style={styles.user}>Olá, {user.name}</span>}
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
          maxWidth: isMobile ? '90%' : 'auto'
        }}>
          {notification.message}
        </div>
      )}

      <div style={styles.main}>
        <div style={{
          ...styles.sidebar,
          display: isMobile && !isSidebarOpen ? 'none' : 'block',
          position: isMobile ? 'fixed' : 'relative',
          zIndex: 100,
          height: isMobile ? '100%' : 'auto',
          width: isMobile ? '100%' : '200px',
          top: 0,
          left: 0,
          backgroundColor: '#111'
        }}>
          {isMobile && (
             <button onClick={() => setIsSidebarOpen(false)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#E50914', fontSize: '24px' }}>✕</button>
          )}
          <div style={{ marginTop: isMobile ? '50px' : '0' }}>
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
          </div>
        </div>

        <main style={{...styles.content, padding: isMobile ? '15px' : '30px'}}>
          {activeTab === 'dashboard' && (
            <div>
              <h2 style={styles.sectionTitle}>Dashboard</h2>
              <div style={{...styles.revenueGrid, gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)'}}>
                <div style={{ ...styles.revenueCard, borderLeftColor: '#E50914' }}>
                  <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '10px' }}>Faturamento Hoje</p>
                  <p style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 'bold', color: '#E50914' }}>R$ {revenueStats.today.toFixed(2)}</p>
                </div>
                <div style={{ ...styles.revenueCard, borderLeftColor: '#007bff' }}>
                  <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '10px' }}>Faturamento Semana</p>
                  <p style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 'bold', color: '#007bff' }}>R$ {revenueStats.thisWeek.toFixed(2)}</p>
                </div>
                <div style={{ ...styles.revenueCard, borderLeftColor: '#28a745' }}>
                  <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '10px' }}>Faturamento Mês</p>
                  <p style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 'bold', color: '#28a745' }}>R$ {revenueStats.thisMonth.toFixed(2)}</p>
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
                  <p style={{...styles.statValue, fontSize: isMobile ? '24px' : '32px'}}>{appointments.filter(apt => apt.status === 'pending').length}</p>
                </div>
                <div style={styles.statCard}>
                  <p style={styles.statLabel}>Agendamentos Concluídos</p>
                  <p style={{...styles.statValue, fontSize: isMobile ? '24px' : '32px'}}>{appointments.filter(apt => apt.status === 'completed').length}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'barbers' && (
            <div>
              <h2 style={styles.sectionTitle}>Gerenciar Barbeiros</h2>
              <button onClick={() => {
                setShowBarberForm(!showBarberForm);
                if (!showBarberForm) {
                  setIsEditingBarber(false);
                  setBarberForm({ id: null, name: '', phone: '', email: '', password: '', specialty: '', photo_url: '', commission_percentage: 0 });
                }
              }} style={styles.addBtn}>
                {showBarberForm ? 'Cancelar' : '+ Adicionar Barbeiro'}
              </button>

              {showBarberForm && (
                <form onSubmit={handleCreateBarber} style={styles.form}>
                  <h3 style={{color: '#E50914', marginBottom: '15px'}}>{isEditingBarber ? 'Editar Barbeiro' : 'Novo Barbeiro'}</h3>
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
                    required
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
                    placeholder={isEditingBarber ? "Nova Senha (deixe em branco para manter)" : "Senha (minimo 6 caracteres)"}
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
                    onChange={(e) =>
                      setBarberForm({ ...barberForm, commission_percentage: parseFloat(e.target.value) })
                    }
                    style={styles.input}
                  />

                  <div style={{...styles.uploadSection, gridTemplateColumns: '1fr'}}>
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
                          <img src={barberForm.photo_url} alt="Barbeiro" style={styles.photoPreview} />
                          <button
                            type="button"
                            onClick={() => setBarberForm({ ...barberForm, photo_url: '' })}
                            style={styles.removePhotoBtn}
                          >
                            ✕ Remover
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <button type="submit" style={styles.submitBtn} disabled={loading || uploadLoading}>
                    {loading ? 'Salvando...' : uploadLoading ? 'Enviando foto...' : 'Salvar Barbeiro'}
                  </button>
                </form>
              )}

              <div style={{...styles.table, overflowX: 'auto'}}>
                {barbers.length === 0 ? (
                  <p style={styles.emptyState}>Nenhum barbeiro cadastrado</p>
                ) : (
                  <div style={{ minWidth: isMobile ? '600px' : 'auto' }}>
                    <div style={{...styles.tableHeader, gridTemplateColumns: '80px 2fr 2fr 2fr 2fr 1.5fr'}}>
                      <div style={styles.tableCell}>Foto</div>
                      <div style={styles.tableCell}>Nome</div>
                      <div style={styles.tableCell}>Email</div>
                      <div style={styles.tableCell}>Telefone</div>
                      <div style={styles.tableCell}>Especialidade</div>
                      <div style={styles.tableCell}>Ações</div>
                    </div>
                    {barbers.map((barber) => (
                      <div key={barber.id} style={{...styles.tableRow, gridTemplateColumns: '80px 2fr 2fr 2fr 2fr 1.5fr'}}>
                        <div style={styles.tableCell}>
                          {barber.photo_url ? (
                            <img
                              src={barber.photo_url}
                              alt={barber.name}
                              style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: '#222',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              👨‍💼
                            </div>
                          )}
                        </div>
                        <div style={styles.tableCell}>{barber.name}</div>
                        <div style={styles.tableCell}>{barber.email || '-'}</div>
                        <div style={styles.tableCell}>{barber.phone}</div>
                        <div style={styles.tableCell}>{barber.specialty || '-'}
                        </div>
                        <div style={styles.tableCell}>
                          <button onClick={() => handleEditBarber(barber)} style={{...styles.addBtn, marginBottom: 0, padding: '6px 12px', fontSize: '12px', marginRight: '5px', backgroundColor: '#007bff'}}>Editar</button>
                          <button onClick={() => handleDeleteBarber(barber.id)} style={styles.deleteBtn}>
                            Deletar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
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

              <div style={{...styles.table, overflowX: 'auto'}}>
                {services.length === 0 ? (
                  <p style={styles.emptyState}>Nenhum serviço cadastrado</p>
                ) : (
                  <div style={{ minWidth: isMobile ? '500px' : 'auto' }}>
                    <div style={styles.tableHeader}>
                      <div style={styles.tableCell}>Serviço</div>
                      <div style={styles.tableCell}>Descrição</div>
                      <div style={styles.tableCell}>Preço</div>
                      <div style={styles.tableCell}>Duração</div>
                      <div style={styles.tableCell}>Ações</div>
                    </div>
                    {services.map((service) => (
                      <div key={service.id} style={styles.tableRow}>
                        <div style={styles.tableCell}>{service.name}</div>
                        <div style={styles.tableCell}>{service.description || '-'}</div>
                        <div style={styles.tableCell}>R$ {parseFloat(service.price).toFixed(2)}</div>
                        <div style={styles.tableCell}>{service.duration} min</div>
                        <div style={styles.tableCell}>
                          <button onClick={() => handleDeleteService(service.id)} style={styles.deleteBtn}>
                            Deletar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'appointments' && (
            <div>
              <h2 style={styles.sectionTitle}>Agendamentos</h2>
              <div style={{...styles.table, overflowX: 'auto'}}>
                {appointments.length === 0 ? (
                  <p style={styles.emptyState}>Nenhum agendamento</p>
                ) : (
                  <div style={{ minWidth: isMobile ? '500px' : 'auto' }}>
                    <div style={styles.tableHeader}>
                      <div style={styles.tableCell}>Data</div>
                      <div style={styles.tableCell}>Hora</div>
                      <div style={styles.tableCell}>Barbeiro</div>
                      <div style={styles.tableCell}>Cliente</div>
                    </div>
                    {appointments.map((apt) => (
                      <div key={apt.id} style={styles.tableRow}>
                        <div style={styles.tableCell}>{new Date(apt.date).toLocaleDateString('pt-BR')}</div>
                        <div style={styles.tableCell}>{apt.time}</div>
                        <div style={styles.tableCell}>{apt.barber_id}</div>
                        <div style={styles.tableCell}>{apt.phone}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 style={styles.sectionTitle}>Configurações da Barbearia</h2>

              <button
                onClick={() => {
                  setIsEditingSettings(!isEditingSettings);
                  setEditSettings(settings || {});
                }}
                style={styles.addBtn}
              >
                {isEditingSettings ? 'Cancelar' : 'Editar'}
              </button>

              {!isEditingSettings && settings && (
                <div style={styles.configCard}>
                  <div style={styles.configItem}>
                    <label style={styles.configLabel}>Nome</label>
                    <p style={styles.configValue}>{settings.name}</p>
                  </div>
                  <div style={styles.configItem}>
                    <label style={styles.configLabel}>Telefone</label>
                    <p style={styles.configValue}>{settings.phone}</p>
                  </div>
                  <div style={styles.configItem}>
                    <label style={styles.configLabel}>Email</label>
                    <p style={styles.configValue}>{settings.email}</p>
                  </div>
                  <div style={styles.configItem}>
                    <label style={styles.configLabel}>Descrição</label>
                    <p style={styles.configValue}>{settings.description || '-'}</p>
                  </div>
                  <div style={styles.configItem}>
                    <label style={styles.configLabel}>Endereço</label>
                    <p style={styles.configValue}>{settings.address}, {settings.city} - {settings.state}</p>
                  </div>
                  <div style={styles.configItem}>
                    <label style={styles.configLabel}>Cores</label>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                      <div style={{ width: '30px', height: '30px', backgroundColor: settings.primary_color, borderRadius: '4px', border: '1px solid #333' }} title="Primária"></div>
                      <div style={{ width: '30px', height: '30px', backgroundColor: settings.secondary_color, borderRadius: '4px', border: '1px solid #333' }} title="Secundária"></div>
                      <div style={{ width: '30px', height: '30px', backgroundColor: settings.accent_color, borderRadius: '4px', border: '1px solid #333' }} title="Destaque"></div>
                    </div>
                  </div>
                  <div style={styles.configItem}>
                    <label style={styles.configLabel}>Imagens</label>
                    <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                      {settings.logo_url && (
                        <div>
                          <p style={{ fontSize: '10px', color: '#aaa', marginBottom: '5px' }}>Logo</p>
                          <img src={settings.logo_url} alt="Logo" style={{ height: '40px', borderRadius: '4px' }} />
                        </div>
                      )}
                      {settings.banner_url && (
                        <div>
                          <p style={{ fontSize: '10px', color: '#aaa', marginBottom: '5px' }}>Banner</p>
                          <img src={settings.banner_url} alt="Banner" style={{ height: '60px', borderRadius: '4px' }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {isEditingSettings && (
                <div style={styles.form}>
                  <form onSubmit={handleSaveSettings}>
                    <h3 style={styles.formSectionTitle}>Informações Básicas</h3>
                    <input
                      type="text"
                      placeholder="Nome da Barbearia"
                      value={editSettings.name || ""}
                      onChange={(e) =>
                        setEditSettings({ ...editSettings, name: e.target.value })
                      }
                      style={styles.input}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Slug da Barbearia (Ex: barbearia-do-ze)"
                      value={editSettings.slug || ""}
                      onChange={(e) =>
                        setEditSettings({ ...editSettings, slug: e.target.value })
                      }
                      style={styles.input}
                      required
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
                    <input
                      type="email"
                      placeholder="Email de Contato"
                      value={editSettings.email || ""}
                      onChange={(e) =>
                        setEditSettings({ ...editSettings, email: e.target.value })
                      }
                      style={styles.input}
                    />
                    <input
                      type="text"
                      placeholder="URL do Instagram"
                      value={editSettings.instagramUrl || ""}
                      onChange={(e) =>
                        setEditSettings({ ...editSettings, instagramUrl: e.target.value })
                      }
                      style={styles.input}
                    />
                    <textarea
                      placeholder="Descrição da Barbearia"
                      value={editSettings.description || ""}
                      onChange={(e) =>
                        setEditSettings({ ...editSettings, description: e.target.value })
                      }
                      style={{ ...styles.input, minHeight: "80px" }}
                    ></textarea>

                    <h3 style={styles.formSectionTitle}>Endereço</h3>
                    <input
                      type="text"
                      placeholder="Endereço"
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
                          <img
                            src={editSettings.logoUrl}
                            alt="Logo"
                            style={styles.uploadPreview}
                          />
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
                          <img
                            src={editSettings.bannerUrl}
                            alt="Banner"
                            style={styles.uploadPreview}
                          />
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
  configLabel: { fontSize: '12px', fontWeight: '500', color: '#E50914', marginBottom: '5px', display: 'block' },
  configValue: { fontSize: '14px', color: '#aaa', margin: '0' },
  formSectionTitle: { fontSize: '16px', fontWeight: 'bold', color: '#E50914', marginTop: '20px', marginBottom: '15px', borderBottom: '1px solid #222', paddingBottom: '10px' },
  label: { fontSize: '12px', fontWeight: '500', color: '#E50914' },
  colorRow: { display: 'grid', gap: '20px', marginBottom: '20px' },
  colorGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  colorInput: { width: '100%', height: '40px', border: '1px solid #333', borderRadius: '4px', cursor: 'pointer' },
  uploadSection: { display: 'grid', gap: '20px', marginBottom: '20px' },
  uploadBox: { backgroundColor: '#1a1a1a', border: '2px dashed #333', borderRadius: '8px', padding: '20px', textAlign: 'center' },
  uploadLabel: { fontSize: '12px', fontWeight: '500', color: '#E50914', display: 'block', marginBottom: '10px' },
  fileInput: { display: 'block', width: '100%', marginBottom: '10px', color: '#aaa' },
  uploadPreview: { maxWidth: '100%', maxHeight: '100px', borderRadius: '4px', marginTop: '10px' },
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