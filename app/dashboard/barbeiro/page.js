'use client';
 
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
 
export default function BarberoDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('agendamentos');
  const [timeFilter, setTimeFilter] = useState('dia');
  const [user, setUser] = useState(null);
  const [tenantName, setTenantName] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '', visible: false });
  const [isMobile, setIsMobile] = useState(false);
 
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
 
  function showNotification(message, type = 'success') {
    setNotification({ message, type, visible: true });
    setTimeout(() => setNotification({ message: '', type: '', visible: false }), 4000);
  }
 
  useEffect(() => {
    const userData = localStorage.getItem('user');
    const tenant = localStorage.getItem('tenant_name');
    if (!userData) { router.push('/login'); return; }
    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'barber') { router.push('/'); return; }
      setUser(parsedUser);
      setTenantName(tenant || 'Minha Barbearia');
      fetchAppointments(parsedUser);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      router.push('/login');
    }
  }, [router]);
 
  async function fetchAppointments(currentUser) {
    try {
      setLoading(true);
      const barberId = currentUser?.id || user?.id;
      const tenantId = currentUser?.tenant_id || user?.tenant_id || 1;
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/appointments/me?tenant_id=${tenantId}&barber_id=${barberId}&t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Authorization': 'Bearer ' + token, 'Cache-Control': 'no-cache' },
      });
      if (!response.ok) throw new Error(`Erro ${response.status}`);
      const result = await response.json();
      if (result.success) setAppointments(result.data || []);
      else showNotification(result.error || 'Erro ao buscar agendamentos', 'error');
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      showNotification('Erro ao buscar agendamentos. Tente novamente.', 'error');
    } finally {
      setLoading(false);
    }
  }
 
  // Filtragem por período
  const filteredAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
 
    if (timeFilter === 'dia') return aptDate.toDateString() === today.toDateString();
 
    if (timeFilter === 'semana') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return aptDate >= startOfWeek && aptDate <= endOfWeek;
    }
 
    if (timeFilter === 'mes') {
      return aptDate.getMonth() === today.getMonth() && aptDate.getFullYear() === today.getFullYear();
    }
 
    return true;
  });
 
  // Stats do período filtrado
  const stats = {
    total: filteredAppointments.length,
    pendentes: filteredAppointments.filter(a => a.status === 'pending' || a.status === 'pendente').length,
    concluidos: filteredAppointments.filter(a => a.status === 'completed' || a.status === 'concluído').length,
    confirmados: filteredAppointments.filter(a => a.status === 'confirmed' || a.status === 'confirmado').length,
    faturamento: filteredAppointments
      .filter(a => ['confirmed', 'completed', 'confirmado', 'concluído'].includes(a.status))
      .reduce((sum, a) => sum + parseFloat(a.total_price || 0), 0),
  };
 
  async function deleteAppointment(id) {
    if (!confirm('Tem certeza que deseja deletar este agendamento?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/appointments/me?id=${id}&tenant_id=${user?.tenant_id || 1}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token },
      });
      const result = await response.json();
      if (response.ok && result.success) {
        showNotification('Agendamento deletado com sucesso!', 'success');
        fetchAppointments(user);
      } else {
        showNotification(result.error || 'Erro ao deletar agendamento', 'error');
      }
    } catch (error) {
      showNotification('Erro ao deletar agendamento.', 'error');
    }
  }
 
  async function logout() {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (e) {}
    localStorage.removeItem('user');
    localStorage.removeItem('tenant_id');
    localStorage.removeItem('tenant_name');
    router.push('/login');
  }
 
  const statusColor = (s) => {
    if (s === 'confirmed' || s === 'confirmado') return '#28a745';
    if (s === 'pending' || s === 'pendente') return '#ff9800';
    if (s === 'completed' || s === 'concluído') return '#007bff';
    if (s === 'cancelled' || s === 'cancelado') return '#dc3545';
    return '#444';
  };
 
  const statusLabel = (s) => {
    const map = { pending: 'PENDENTE', pendente: 'PENDENTE', confirmed: 'CONFIRMADO', confirmado: 'CONFIRMADO', completed: 'CONCLUÍDO', 'concluído': 'CONCLUÍDO', cancelled: 'CANCELADO', cancelado: 'CANCELADO' };
    return map[s] || (s || '').toUpperCase();
  };
 
  const filterLabels = { dia: 'Hoje', semana: 'Semana', mes: 'Mês', todos: 'Todos' };
 
  if (!user) return <div style={styles.loading}>Carregando...</div>;
 
  return (
    <div style={styles.container}>
      {notification.visible && (
        <div style={{ ...styles.notification, ...(notification.type === 'error' ? styles.notificationError : styles.notificationSuccess) }}>
          {notification.message}
        </div>
      )}
 
      <header style={styles.header}>
        <div style={styles.logo}>BarberSaaS</div>
        <div style={styles.headerRight}>
          <div style={styles.userInfo}>
            <div style={styles.userName}>✂️ {user.name}</div>
            <div style={styles.tenantName}>{tenantName}</div>
          </div>
          <button style={styles.logoutBtn} onClick={logout}>Sair</button>
        </div>
      </header>
 
      <div style={{ ...styles.mainContainer, flexDirection: isMobile ? 'column' : 'row' }}>
        {/* Sidebar */}
        <div style={{ ...styles.sidebar, width: isMobile ? '100%' : '220px' }}>
          {[
            { id: 'agendamentos', label: '📅 Meus Agendamentos' },
            { id: 'perfil', label: '👤 Meu Perfil' },
          ].map((item) => (
            <div key={item.id}
              style={{ ...styles.sidebarItem, ...(activeTab === item.id ? styles.sidebarItemActive : {}) }}
              onClick={() => setActiveTab(item.id)}
            >
              {item.label}
            </div>
          ))}
        </div>
 
        <div style={{ ...styles.content, padding: isMobile ? '15px' : '40px' }}>
          {activeTab === 'agendamentos' && (
            <div>
              <div style={{ ...styles.pageHeader, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center' }}>
                <h1 style={styles.pageTitle}>Meus Agendamentos</h1>
                {/* Filtros */}
                <div style={styles.filterContainer}>
                  {['dia', 'semana', 'mes', 'todos'].map(f => (
                    <button key={f} onClick={() => setTimeFilter(f)}
                      style={{ ...styles.filterBtn, ...(timeFilter === f ? styles.filterBtnActive : {}) }}>
                      {filterLabels[f]}
                    </button>
                  ))}
                </div>
              </div>
 
              {/* Cards de estatísticas */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Total</div>
                  <div style={styles.statValue}>{stats.total}</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Pendentes</div>
                  <div style={{ ...styles.statValue, color: '#ff9800' }}>{stats.pendentes}</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Confirmados</div>
                  <div style={{ ...styles.statValue, color: '#28a745' }}>{stats.confirmados}</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Concluídos</div>
                  <div style={{ ...styles.statValue, color: '#007bff' }}>{stats.concluidos}</div>
                </div>
                <div style={{ ...styles.statCard, gridColumn: isMobile ? 'span 2' : 'auto' }}>
                  <div style={styles.statLabel}>Faturamento</div>
                  <div style={{ ...styles.statValue, fontSize: isMobile ? '16px' : '20px', color: '#28a745' }}>
                    R$ {stats.faturamento.toFixed(2)}
                  </div>
                </div>
              </div>
 
              {/* Tabela */}
              <div style={styles.table}>
                <div style={{ ...styles.tableHeader, gridTemplateColumns: isMobile ? '1fr 1fr' : '1.2fr 1.5fr 1.5fr 1fr 1fr' }}>
                  <div style={styles.tableCell}>Data/Hora</div>
                  <div style={styles.tableCell}>Cliente</div>
                  {!isMobile && <div style={styles.tableCell}>Serviço</div>}
                  <div style={styles.tableCell}>Status</div>
                  <div style={styles.tableCell}>Ações</div>
                </div>
 
                {loading ? (
                  <div style={styles.emptyState}>Carregando...</div>
                ) : filteredAppointments.length === 0 ? (
                  <div style={styles.emptyState}>Nenhum agendamento para este período.</div>
                ) : (
                  filteredAppointments
                    .sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time))
                    .map((apt) => (
                      <div key={apt.id} style={{ ...styles.tableRow, gridTemplateColumns: isMobile ? '1fr 1fr' : '1.2fr 1.5fr 1.5fr 1fr 1fr' }}>
                        <div style={styles.tableCell}>
                          <div style={{ fontWeight: 'bold' }}>{new Date(apt.date + 'T00:00:00').toLocaleDateString('pt-BR')}</div>
                          <div style={{ color: '#E50914', fontWeight: 'bold' }}>{apt.time}</div>
                        </div>
                        <div style={styles.tableCell}>
                          <div style={{ fontWeight: 'bold' }}>{apt.client_name || 'Cliente'}</div>
                          <div style={{ fontSize: '11px', color: '#aaa' }}>
                            {apt.phone ? (
                              <a href={`https://wa.me/${apt.phone.replace(/\D/g, '')}`} target="_blank"
                                style={{ color: '#4ade80', textDecoration: 'none' }}>
                                📱 {apt.phone}
                              </a>
                            ) : 'Sem número'}
                          </div>
                        </div>
                        {!isMobile && (
                          <div style={styles.tableCell}>
                            <span style={styles.serviceBadge}>{apt.service_names || apt.service_name || '-'}</span>
                          </div>
                        )}
                        <div style={styles.tableCell}>
                          <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', backgroundColor: statusColor(apt.status), color: '#fff' }}>
                            {statusLabel(apt.status)}
                          </span>
                        </div>
                        <div style={styles.tableCell}>
                          <button style={styles.deleteBtn} onClick={() => deleteAppointment(apt.id)}>Deletar</button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
 
          {activeTab === 'perfil' && (
            <div>
              <h1 style={styles.pageTitle}>Meu Perfil</h1>
              <div style={styles.profileCard}>
                <div style={styles.profileSection}>
                  <h2 style={styles.sectionTitle}>Informações Pessoais</h2>
                  <div style={styles.profileInfo}>
                    {[
                      { label: 'Nome', value: user.name },
                      { label: 'Email', value: user.email },
                      { label: 'Função', value: 'Barbeiro' },
                      { label: 'Barbearia', value: tenantName },
                    ].map(item => (
                      <div key={item.label} style={styles.infoRow}>
                        <label style={styles.infoLabel}>{item.label}:</label>
                        <span style={styles.infoValue}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
 
const styles = {
  container: { minHeight: '100vh', backgroundColor: '#0A0A0A', color: '#fff', fontFamily: 'sans-serif' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#0A0A0A', color: '#E50914', fontSize: '18px' },
  notification: { position: 'fixed', top: '20px', right: '20px', padding: '15px 20px', borderRadius: '8px', zIndex: 1000, fontWeight: 'bold' },
  notificationSuccess: { backgroundColor: '#10B981', color: '#fff' },
  notificationError: { backgroundColor: '#EF4444', color: '#fff' },
  header: { backgroundColor: '#000', padding: '20px 40px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logo: { fontSize: '24px', fontWeight: 'bold', color: '#E50914', letterSpacing: '2px' },
  headerRight: { display: 'flex', gap: '20px', alignItems: 'center' },
  userInfo: { textAlign: 'right', fontSize: '13px' },
  userName: { fontWeight: 'bold', color: '#E50914' },
  tenantName: { color: '#aaa' },
  logoutBtn: { backgroundColor: '#E50914', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  mainContainer: { display: 'flex', minHeight: 'calc(100vh - 70px)' },
  sidebar: { backgroundColor: '#111', borderRight: '1px solid #222', padding: '20px 0' },
  sidebarItem: { padding: '15px 20px', cursor: 'pointer', transition: 'all 0.3s', borderLeft: '3px solid transparent', color: '#aaa', fontSize: '14px' },
  sidebarItemActive: { backgroundColor: '#1a1a1a', color: '#E50914', borderLeftColor: '#E50914' },
  content: { flex: 1, overflowY: 'auto' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' },
  pageTitle: { fontSize: '24px', fontWeight: 'bold', color: '#E50914', margin: 0 },
  filterContainer: { display: 'flex', gap: '8px', backgroundColor: '#111', padding: '5px', borderRadius: '8px', border: '1px solid #222' },
  filterBtn: { padding: '8px 16px', border: 'none', borderRadius: '6px', backgroundColor: 'transparent', color: '#aaa', cursor: 'pointer', fontSize: '13px' },
  filterBtnActive: { backgroundColor: '#E50914', color: '#000', fontWeight: 'bold' },
  statCard: { backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px', padding: '16px', textAlign: 'center' },
  statLabel: { fontSize: '12px', color: '#aaa', marginBottom: '6px' },
  statValue: { fontSize: '26px', fontWeight: 'bold', color: '#E50914' },
  table: { backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px', overflow: 'hidden' },
  tableHeader: { display: 'grid', backgroundColor: '#1a1a1a', padding: '15px', fontWeight: 'bold', borderBottom: '1px solid #222', fontSize: '13px' },
  tableCell: { padding: '8px 10px', fontSize: '13px' },
  tableRow: { display: 'grid', padding: '15px', borderBottom: '1px solid #222', alignItems: 'center' },
  serviceBadge: { backgroundColor: '#E5091420', color: '#E50914', padding: '4px 8px', borderRadius: '4px', border: '1px solid #E50914', fontSize: '11px', display: 'inline-block' },
  emptyState: { padding: '30px', textAlign: 'center', color: '#aaa' },
  deleteBtn: { backgroundColor: '#FF6B6B', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' },
  profileCard: { backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px', padding: '30px' },
  profileSection: { marginBottom: '30px' },
  sectionTitle: { fontSize: '18px', fontWeight: 'bold', color: '#E50914', marginBottom: '20px' },
  profileInfo: { display: 'grid', gap: '15px' },
  infoRow: { display: 'flex', gap: '20px', alignItems: 'center', paddingBottom: '15px', borderBottom: '1px solid #222' },
  infoLabel: { fontSize: '13px', color: '#aaa', minWidth: '120px', fontWeight: 'bold' },
  infoValue: { fontSize: '14px', color: '#fff' },
};
 