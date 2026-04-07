'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [tenantName, setTenantName] = useState('');
  
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [notification, setNotification] = useState({ message: '', type: '', visible: false });
  
  const [showBarberForm, setShowBarberForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [barberForm, setBarberForm] = useState({ name: '', phone: '', specialty: '', photo_url: '', commission_percentage: 0 });
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', price: 0, duration: 0 });
  
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [editSettings, setEditSettings] = useState({});
  const [uploadLoading, setUploadLoading] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState([]);

  function showNotification(message, type = 'success') {
    setNotification({ message, type, visible: true });
    setTimeout(() => {
      setNotification({ message: '', type: '', visible: false });
    }, 4000);
  }

  async function apiCall(url, options = {}) {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Token não encontrado. Faça login novamente.');
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.clear();
          window.location.href = '/login';
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        throw new Error('Erro ' + response.status + ': ' + response.statusText);
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
  }, []);

  async function fetchServices() {
    try {
      setLoading(true);

      const tenantId = localStorage.getItem('tenant_id');
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
      const data = await apiCall('/api/barbers');
      setBarbers(data.data || []);
    } catch (error) {
      console.error('Erro ao buscar barbeiros:', error);
      showNotification('Erro ao buscar barbeiros', 'error');
    }
  }

  async function fetchAppointments() {
    try {
      const data = await apiCall('/api/appointments');
      setAppointments(data.data || []);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      showNotification('Erro ao buscar agendamentos', 'error');
    }
  }

  async function fetchSettings() {
    try {
      const tenantId = localStorage.getItem('tenant_id');
      const data = await apiCall('/api/public/settings?tenant_id=' + tenantId);
      setSettings(data.data || {});
      setEditSettings(data.data || {});

      const galleryResponse = await apiCall('/api/public/gallery?tenant_id=' + tenantId);
      setGalleryPhotos(galleryResponse.data || []);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    }
  }

  async function handleCreateBarber(e) {
    e.preventDefault();
    if (!barberForm.name || !barberForm.phone) {
      showNotification('Preencha todos os campos', 'error');
      return;
    }

    try {
      setLoading(true);
      const tenantId = localStorage.getItem('tenant_id');
      await apiCall('/api/barbers', {
        method: 'POST',
        body: JSON.stringify({
          ...barberForm,
          tenant_id: tenantId
        }),
      });

      showNotification('Barbeiro criado com sucesso!', 'success');
      setBarberForm({ name: '', phone: '', specialty: '', photo_url: '', commission_percentage: 0 });
      setShowBarberForm(false);
      fetchBarbers();
    } catch (error) {
      console.error('Erro:', error);
      showNotification(error.message || 'Erro ao criar barbeiro', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateService(e) {
    e.preventDefault();
    if (!serviceForm.name || serviceForm.price <= 0 || serviceForm.duration <= 0) {
      showNotification('Preencha todos os campos corretamente', 'error');
      return;
    }

    try {
      setLoading(true);
      const tenantId = localStorage.getItem('tenant_id');

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
      
      // CORREÇÃO ROBUSTA: Pega a URL independente do nome do campo (url ou image_url)
      const fileUrl = data.url || data.image_url;

      if (!fileUrl) {
        throw new Error('URL do arquivo não retornada pela API');
      }

      if (type === 'gallery') {
        setGalleryPhotos([...galleryPhotos, data]);
      } else if (type === 'banner') {
        setEditSettings({ ...editSettings, banner_url: fileUrl });
      } else if (type === 'logo') {
        setEditSettings({ ...editSettings, logo_url: fileUrl });
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
      const tenantId = localStorage.getItem('tenant_id');
      
      if (!token || !tenantId) {
        showNotification('Token ou Tenant ID não encontrado', 'error');
        return;
      }

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
          'x-tenant-id': tenantId,
        },
        body: JSON.stringify(editSettings),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setIsEditingSettings(false);
        showNotification('Configurações salvas com sucesso!', 'success');
      } else {
        const error = await response.json();
        showNotification(error.error || 'Erro ao salvar configurações', 'error');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      showNotification('Erro ao salvar configurações', 'error');
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      localStorage.clear();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Painel ADM - {tenantName}</h1>
        <div style={styles.headerRight}>
          {user && <span style={styles.user}>{user.email}</span>}
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>

      {notification.visible && (
        <div style={{
          ...styles.notification,
          backgroundColor: notification.type === 'success' ? '#4CAF50' : '#f44336'
        }}>
          {notification.message}
        </div>
      )}

      <div style={styles.main}>
        <div style={styles.sidebar}>
          {['dashboard', 'barbers', 'services', 'appointments', 'settings'].map((tab) => (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                ...styles.sidebarItem,
                backgroundColor: activeTab === tab ? '#1a1a1a' : 'transparent',
                borderLeftColor: activeTab === tab ? '#E50914' : 'transparent',
                color: activeTab === tab ? '#E50914' : '#aaa',
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </div>
          ))}
        </div>

        <div style={styles.content}>
          {activeTab === 'dashboard' && (
            <div>
              <h2 style={styles.sectionTitle}>Dashboard</h2>
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Total de Barbeiros</div>
                  <div style={styles.statValue}>{barbers.length}</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Total de Serviços</div>
                  <div style={styles.statValue}>{services.length}</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Total de Agendamentos</div>
                  <div style={styles.statValue}>{appointments.length}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'barbers' && (
            <div>
              <h2 style={styles.sectionTitle}>Gerenciar Barbeiros</h2>
              <button onClick={() => setShowBarberForm(!showBarberForm)} style={styles.addBtn}>
                {showBarberForm ? 'Cancelar' : '+ Adicionar Barbeiro'}
              </button>

              {showBarberForm && (
                <form onSubmit={handleCreateBarber} style={styles.form}>
                  <input
                    type="text"
                    placeholder="Nome do Barbeiro"
                    value={barberForm.name}
                    onChange={(e) => setBarberForm({ ...barberForm, name: e.target.value })}
                    style={styles.input}
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Telefone"
                    value={barberForm.phone}
                    onChange={(e) => setBarberForm({ ...barberForm, phone: e.target.value })}
                    style={styles.input}
                    required
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

                  <div style={styles.uploadSection}>
                    <div style={styles.uploadBox}>
                      <label style={styles.uploadLabel}>📷 Foto do Barbeiro</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'barber')}
                        style={styles.fileInput}
                        disabled={uploadLoading}
                      />
                      {barberForm.photo_url && (
                        <div style={styles.photoPreviewContainer}>
                          <img 
                            src={barberForm.photo_url} 
                            alt="Foto do Barbeiro" 
                            style={styles.photoPreview}
                          />
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

              <div style={styles.table}>
                {barbers.length === 0 ? (
                  <p style={styles.emptyState}>Nenhum barbeiro cadastrado</p>
                ) : (
                  <>
                    <div style={styles.tableHeader}>
                      <div style={styles.tableCell}>Foto</div>
                      <div style={styles.tableCell}>Nome</div>
                      <div style={styles.tableCell}>Telefone</div>
                      <div style={styles.tableCell}>Especialidade</div>
                      <div style={styles.tableCell}>Ações</div>
                    </div>
                    {barbers.map((barber) => (
                      <div key={barber.id} style={styles.tableRow}>
                        <div style={styles.tableCell}>
                          {barber.photo_url ? (
                            <img src={barber.photo_url} alt={barber.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👨‍💼</div>
                          )}
                        </div>
                        <div style={styles.tableCell}>{barber.name}</div>
                        <div style={styles.tableCell}>{barber.phone}</div>
                        <div style={styles.tableCell}>{barber.specialty || '-'}</div>
                        <div style={styles.tableCell}>
                          <button onClick={() => handleDeleteBarber(barber.id)} style={styles.deleteBtn}>
                            Deletar
                          </button>
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
                  <p style={styles.emptyState}>Nenhum agendamento</p>
                ) : (
                  <>
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
                  </>
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
                    <label style={styles.configLabel}>Endereço</label>
                    <p style={styles.configValue}>
                      {settings.address}, {settings.city} - {settings.state}
                    </p>
                  </div>
                  <div style={styles.configItem}>
                    <label style={styles.configLabel}>Descrição</label>
                    <p style={styles.configValue}>{settings.description}</p>
                  </div>
                </div>
              )}

              {isEditingSettings && (
                <form onSubmit={handleSaveSettings} style={styles.form}>
                  <h3 style={styles.formSectionTitle}>Informações Básicas</h3>

                  <input
                    type="text"
                    placeholder="Nome da Barbearia"
                    value={editSettings.name || ''}
                    onChange={(e) => setEditSettings({ ...editSettings, name: e.target.value })}
                    style={styles.input}
                  />

                  <input
                    type="tel"
                    placeholder="Telefone"
                    value={editSettings.phone || ''}
                    onChange={(e) => setEditSettings({ ...editSettings, phone: e.target.value })}
                    style={styles.input}
                  />

                  <input
                    type="tel"
                    placeholder="WhatsApp (com DDD ex: 11999999999)"
                    value={editSettings.whatsapp || ''}
                    onChange={(e) => setEditSettings({ ...editSettings, whatsapp: e.target.value })}
                    style={styles.input}
                  />

                  <input
                    type="url"
                    placeholder="Instagram (https://instagram.com/seu_usuario )"
                    value={editSettings.instagram_url || ''}
                    onChange={(e) => setEditSettings({ ...editSettings, instagram_url: e.target.value })}
                    style={styles.input}
                  />

                  <input
                    type="text"
                    placeholder="Endereço"
                    value={editSettings.address || ''}
                    onChange={(e) => setEditSettings({ ...editSettings, address: e.target.value })}
                    style={styles.input}
                  />

                  <input
                    type="text"
                    placeholder="Cidade"
                    value={editSettings.city || ''}
                    onChange={(e) => setEditSettings({ ...editSettings, city: e.target.value })}
                    style={styles.input}
                  />

                  <input
                    type="text"
                    placeholder="Estado"
                    value={editSettings.state || ''}
                    onChange={(e) => setEditSettings({ ...editSettings, state: e.target.value })}
                    style={styles.input}
                    maxLength="2"
                  />

                  <input
                    type="text"
                    placeholder="CEP"
                    value={editSettings.zip_code || ''}
                    onChange={(e) => setEditSettings({ ...editSettings, zip_code: e.target.value })}
                    style={styles.input}
                  />

                  <h3 style={styles.formSectionTitle}>Horários</h3>

                  <input
                    type="time"
                    value={editSettings.opening_time || ''}
                    onChange={(e) => setEditSettings({ ...editSettings, opening_time: e.target.value })}
                    style={styles.input}
                  />

                  <input
                    type="time"
                    value={editSettings.closing_time || ''}
                    onChange={(e) => setEditSettings({ ...editSettings, closing_time: e.target.value })}
                    style={styles.input}
                  />

                  <h3 style={styles.formSectionTitle}>⏰ Intervalo de Agendamento</h3>

                  <div style={styles.radioGroup}>
                    <label style={styles.radioLabel}>
                      <input
                        type="radio"
                        value="15"
                        checked={editSettings.appointment_interval === 15}
                        onChange={(e) =>
                          setEditSettings({
                            ...editSettings,
                            appointment_interval: parseInt(e.target.value)
                          })
                        }
                        style={styles.radioInput}
                      />
                      <span>15 minutos</span>
                    </label>
                    <label style={styles.radioLabel}>
                      <input
                        type="radio"
                        value="30"
                        checked={editSettings.appointment_interval === 30}
                        onChange={(e) =>
                          setEditSettings({
                            ...editSettings,
                            appointment_interval: parseInt(e.target.value)
                          })
                        }
                        style={styles.radioInput}
                      />
                      <span>30 minutos</span>
                    </label>
                  </div>

                  <h3 style={styles.formSectionTitle}>Cores Personalizadas</h3>

                  <div style={styles.colorRow}>
                    <div style={styles.colorGroup}>
                      <label style={styles.label}>Cor Primária</label>
                      <input
                        type="color"
                        value={editSettings.primary_color || '#E50914'}
                        onChange={(e) => setEditSettings({ ...editSettings, primary_color: e.target.value })}
                        style={styles.colorInput}
                      />
                    </div>

                    <div style={styles.colorGroup}>
                      <label style={styles.label}>Cor Secundária</label>
                      <input
                        type="color"
                        value={editSettings.secondary_color || '#000'}
                        onChange={(e) => setEditSettings({ ...editSettings, secondary_color: e.target.value })}
                        style={styles.colorInput}
                      />
                    </div>

                    <div style={styles.colorGroup}>
                      <label style={styles.label}>Cor Destaque</label>
                      <input
                        type="color"
                        value={editSettings.accent_color || '#fff'}
                        onChange={(e) => setEditSettings({ ...editSettings, accent_color: e.target.value })}
                        style={styles.colorInput}
                      />
                    </div>
                  </div>

                  <h3 style={styles.formSectionTitle}>Fotos</h3>

                  <div style={styles.uploadSection}>
                    <div style={styles.uploadBox}>
                      <label style={styles.uploadLabel}>Logo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'logo')}
                        style={styles.fileInput}
                        disabled={uploadLoading}
                      />
                      {editSettings.logo_url && (
                        <div style={styles.photoPreviewContainer}>
                          <img src={editSettings.logo_url} alt="Logo" style={styles.uploadPreview} />
                          <button
                            type="button"
                            onClick={() => setEditSettings({ ...editSettings, logo_url: '' })}
                            style={styles.removePhotoBtn}
                          >
                            ✕ Remover
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={styles.uploadBox}>
                      <label style={styles.uploadLabel}>Banner</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'banner')}
                        style={styles.fileInput}
                        disabled={uploadLoading}
                      />
                      {editSettings.banner_url && (
                        <div style={styles.photoPreviewContainer}>
                          <img src={editSettings.banner_url} alt="Banner" style={styles.uploadPreview} />
                          <button
                            type="button"
                            onClick={() => setEditSettings({ ...editSettings, banner_url: '' })}
                            style={styles.removePhotoBtn}
                          >
                            ✕ Remover
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={styles.uploadBox}>
                      <label style={styles.uploadLabel}>Galeria</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'gallery')}
                        style={styles.fileInput}
                        disabled={uploadLoading}
                      />
                    </div>
                  </div>

                  {galleryPhotos.length > 0 && (
                    <div style={styles.galleryPreview}>
                      <h4 style={styles.galleryTitle}>Fotos da Galeria</h4>
                      <div style={styles.galleryGrid}>
                        {galleryPhotos.map((photo) => (
                          <div key={photo.id} style={styles.galleryItemContainer}>
                            <img src={photo.image_url} alt="Galeria" style={styles.galleryItemImage} />
                            <button
                              type="button"
                              onClick={() => handleDeletePhoto(photo.id)}
                              style={styles.deleteBtn}
                            >
                              Deletar
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <h3 style={styles.formSectionTitle}>Descrição</h3>

                  <textarea
                    placeholder="Descrição da Barbearia"
                    value={editSettings.description || ''}
                    onChange={(e) => setEditSettings({ ...editSettings, description: e.target.value })}
                    style={{ ...styles.input, minHeight: '100px' }}
                  />

                  <button type="submit" style={styles.submitBtn} disabled={uploadLoading}>
                    {uploadLoading ? 'Salvando...' : 'Salvar Configurações'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  radioGroup: { display: 'flex', gap: '30px', marginTop: '10px' },
  radioLabel: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: '#fff' },
  radioInput: { width: '18px', height: '18px', cursor: 'pointer', accentColor: '#E50914' },
  container: { backgroundColor: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'Arial, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', backgroundColor: '#111', borderBottom: '1px solid #222' },
  title: { fontSize: '28px', fontWeight: 'bold', color: '#E50914', margin: 0 },
  headerRight: { display: 'flex', alignItems: 'center', gap: '20px' },
  user: { fontSize: '14px', color: '#aaa' },
  logoutBtn: { backgroundColor: '#E50914', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  notification: { padding: '15px', margin: '20px', borderRadius: '4px', color: '#000', fontWeight: 'bold' },
  main: { display: 'flex', minHeight: 'calc(100vh - 80px)' },
  sidebar: { width: '200px', backgroundColor: '#111', borderRight: '1px solid #222', padding: '20px 0' },
  sidebarItem: { padding: '15px 20px', cursor: 'pointer', borderLeft: '3px solid transparent', color: '#aaa', fontSize: '14px', transition: 'all 0.3s' },
  content: { flex: 1, padding: '30px', overflowY: 'auto' },
  sectionTitle: { fontSize: '24px', fontWeight: 'bold', color: '#E50914', marginBottom: '20px' },
  addBtn: { backgroundColor: '#E50914', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '20px' },
  form: { backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px', padding: '20px', marginBottom: '20px' },
  input: { width: '100%', padding: '10px', marginBottom: '10px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', color: '#fff', boxSizing: 'border-box' },
  submitBtn: { width: '100%', padding: '12px', backgroundColor: '#E50914', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
  table: { backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px', overflow: 'hidden' },
  tableHeader: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', padding: '15px', backgroundColor: '#1a1a1a', borderBottom: '1px solid #222', fontWeight: 'bold' },
  tableCell: { padding: '10px', fontSize: '13px' },
  tableRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', padding: '15px', borderBottom: '1px solid #222', alignItems: 'center' },
  emptyState: { padding: '30px', textAlign: 'center', color: '#aaa' },
  deleteBtn: { backgroundColor: '#FF6B6B', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' },
  statCard: { backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px', padding: '20px', textAlign: 'center' },
  statLabel: { fontSize: '14px', color: '#aaa', marginBottom: '10px' },
  statValue: { fontSize: '32px', fontWeight: 'bold', color: '#E50914' },
  configCard: { backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px', padding: '30px', marginBottom: '20px' },
  configItem: { marginBottom: '20px' },
  configLabel: { fontSize: '12px', fontWeight: '500', color: '#E50914', marginBottom: '5px', display: 'block' },
  configValue: { fontSize: '14px', color: '#aaa', margin: '0' },
  formSectionTitle: { fontSize: '16px', fontWeight: 'bold', color: '#E50914', marginTop: '20px', marginBottom: '15px', borderBottom: '1px solid #222', paddingBottom: '10px' },
  label: { fontSize: '12px', fontWeight: '500', color: '#E50914' },
  colorRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' },
  colorGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  colorInput: { width: '100%', height: '40px', border: '1px solid #333', borderRadius: '4px', cursor: 'pointer' },
  uploadSection: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' },
  uploadBox: { backgroundColor: '#1a1a1a', border: '2px dashed #333', borderRadius: '8px', padding: '20px', textAlign: 'center' },
  uploadLabel: { fontSize: '12px', fontWeight: '500', color: '#E50914', display: 'block', marginBottom: '10px' },
  fileInput: { display: 'block', width: '100%', marginBottom: '10px', color: '#aaa' },
  uploadPreview: { maxWidth: '100%', maxHeight: '100px', borderRadius: '4px', marginTop: '10px' },
  photoPreviewContainer: { marginTop: '15px', textAlign: 'center' },
  photoPreview: { maxWidth: '100%', maxHeight: '150px', borderRadius: '8px', marginBottom: '10px', border: '2px solid #E50914' },
  removePhotoBtn: { backgroundColor: '#FF6B6B', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' },
  galleryPreview: { marginTop: '30px' },
  galleryTitle: { fontSize: '14px', fontWeight: 'bold', color: '#E50914', marginBottom: '15px' },
  galleryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' },
  galleryItemContainer: { position: 'relative', borderRadius: '8px', overflow: 'hidden' },
  galleryItemImage: { width: '100%', height: '150px', objectFit: 'cover' },
};