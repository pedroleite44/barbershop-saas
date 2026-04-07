'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BarberoDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('agendamentos');
  const [user, setUser] = useState(null);
  const [tenantName, setTenantName] = useState('');
  
  // Data states
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Feedback states
  const [notification, setNotification] = useState({ message: '', type: '', visible: false });

  // Mostrar notificação
  function showNotification(message, type = 'success') {
    setNotification({ message, type, visible: true });
    setTimeout(() => {
      setNotification({ message: '', type: '', visible: false });
    }, 4000);
  }

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const tenant = localStorage.getItem('tenant_name');

    if (!userData) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'barber') {
        router.push('/');
        return;
      }

      setUser(parsedUser);
      setTenantName(tenant || 'Minha Barbearia');
      
      // Fetch initial data
      fetchAppointments();
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showNotification('Erro ao carregar dados. Faça login novamente.', 'error');
      router.push('/login');
    }
  }, [router]);

  // BUSCAR AGENDAMENTOS DO BARBEIRO (ROTA SEGURA)
  async function fetchAppointments() {
    try {
      setLoading(true);
      const response = await fetch('/api/appointments/me', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result.success) {
        setAppointments(result.data || []);
      } else {
        showNotification(result.error || 'Erro ao buscar agendamentos', 'error');
      }
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      showNotification('Erro ao buscar agendamentos. Tente novamente.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function deleteAppointment(id) {
    if (!confirm('Tem certeza que deseja deletar este agendamento?')) return;

    try {
      const response = await fetch(`/api/appointments/me?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      const result = await response.json();

      if (response.ok && result.success) {
        showNotification('Agendamento deletado com sucesso!', 'success');
        fetchAppointments();
      } else {
        showNotification(result.error || 'Erro ao deletar agendamento', 'error');
      }
    } catch (error) {
      console.error('Erro ao deletar agendamento:', error);
      showNotification('Erro ao deletar agendamento. Tente novamente.', 'error');
    }
  }

  async function logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }

    localStorage.removeItem('user');
    localStorage.removeItem('tenant_id');
    localStorage.removeItem('tenant_name');
    router.push('/login');
  }

  if (!user) return <div style={styles.loading}>Carregando...</div>;

  return (
    <div style={styles.container}>
      {notification.visible && (
        <div style={{
          ...styles.notification,
          ...(notification.type === 'error' ? styles.notificationError : styles.notificationSuccess)
        }}>
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
          <button style={styles.logoutBtn} onClick={logout}>
            Sair
          </button>
        </div>
      </header>

      <div style={styles.mainContainer}>
        <div style={styles.sidebar}>
          {[
            { id: 'agendamentos', label: '📅 Meus Agendamentos' },
            { id: 'perfil', label: '👤 Meu Perfil' },
          ].map((item) => (
            <div
              key={item.id}
              style={{
                ...styles.sidebarItem,
                ...(activeTab === item.id ? styles.sidebarItemActive : {}),
              }}
              onClick={() => setActiveTab(item.id)}
            >
              {item.label}
            </div>
          ))}
        </div>

        <div style={styles.content}>
          {activeTab === 'agendamentos' && (
            <div>
              <h1 style={styles.pageTitle}>Meus Agendamentos</h1>
              
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Total de Agendamentos</div>
                  <div style={styles.statValue}>{appointments.length}</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Hoje</div>
                  <div style={styles.statValue}>
                    {appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length}
                  </div>
                </div>
              </div>

              <div style={styles.table}>
                <div style={styles.tableHeader}>
                  <div style={styles.tableCell}>Data</div>
                  <div style={styles.tableCell}>Hora</div>
                  <div style={styles.tableCell}>Cliente</div>
                  <div style={styles.tableCell}>Telefone</div>
                  <div style={styles.tableCell}>Ações</div>
                </div>
                {appointments.length === 0 ? (
                  <div style={styles.emptyState}>Nenhum agendamento</div>
                ) : (
                  appointments.map((apt) => (
                    <div key={apt.id} style={styles.tableRow}>
                      <div style={styles.tableCell}>{apt.date}</div>
                      <div style={styles.tableCell}>{apt.time}</div>
                      <div style={styles.tableCell}>-</div>
                      <div style={styles.tableCell}>{apt.phone}</div>
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
                    <div style={styles.infoRow}>
                      <label style={styles.infoLabel}>Nome:</label>
                      <span style={styles.infoValue}>{user.name}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <label style={styles.infoLabel}>Email:</label>
                      <span style={styles.infoValue}>{user.email}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <label style={styles.infoLabel}>Função:</label>
                      <span style={styles.infoValue}>Barbeiro</span>
                    </div>
                    <div style={styles.infoRow}>
                      <label style={styles.infoLabel}>Barbearia:</label>
                      <span style={styles.infoValue}>{tenantName}</span>
                    </div>
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
  container: { minHeight: '100vh', backgroundColor: '#0A0A0A', color: '#fff' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#0A0A0A', color: '#E50914', fontSize: '18px' },
  
  notification: { 
    position: 'fixed', 
    top: '20px', 
    right: '20px', 
    padding: '15px 20px', 
    borderRadius: '8px', 
    zIndex: 1000,
  },
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
  sidebar: { width: '250px', backgroundColor: '#111', borderRight: '1px solid #222', padding: '20px 0' },
  sidebarItem: { padding: '15px 20px', cursor: 'pointer', transition: 'all 0.3s', borderLeft: '3px solid transparent', color: '#aaa' },
  sidebarItemActive: { backgroundColor: '#1a1a1a', color: '#E50914', borderLeftColor: '#E50914' },
  content: { flex: 1, padding: '40px', overflowY: 'auto' },
  
  pageTitle: { fontSize: '28px', fontWeight: 'bold', color: '#E50914', marginBottom: '30px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', marginBottom: '30px' },
  statCard: { backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px', padding: '20px', textAlign: 'center' },
  statLabel: { fontSize: '13px', color: '#aaa', marginBottom: '10px' },
  statValue: { fontSize: '32px', fontWeight: 'bold', color: '#E50914' },
  
  table: { backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px', overflow: 'hidden' },
  tableHeader: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', backgroundColor: '#1a1a1a', padding: '15px', fontWeight: 'bold', borderBottom: '1px solid #222' },
  tableCell: { padding: '10px', fontSize: '13px' },
  tableRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', padding: '15px', borderBottom: '1px solid #222', alignItems: 'center' },
  emptyState: { padding: '30px', textAlign: 'center', color: '#aaa' },
  deleteBtn: { backgroundColor: '#FF6B6B', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  
  profileCard: { backgroundColor: '#111', border: '1px solid #222', borderRadius: '8px', padding: '30px' },
  profileSection: { marginBottom: '30px' },
  sectionTitle: { fontSize: '18px', fontWeight: 'bold', color: '#E50914', marginBottom: '20px' },
  profileInfo: { display: 'grid', gap: '15px' },
  infoRow: { display: 'flex', gap: '20px', alignItems: 'center', paddingBottom: '15px', borderBottom: '1px solid #222' },
  infoLabel: { fontSize: '13px', color: '#aaa', minWidth: '120px', fontWeight: 'bold' },
  infoValue: { fontSize: '14px', color: '#fff' },
};