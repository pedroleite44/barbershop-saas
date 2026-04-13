'use client';

import { useState, useEffect } from 'react';

export default function SuperAdminPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', slug: '', phone: '', email: '', password: '' });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => { fetchTenants(); }, []);

  async function fetchTenants() {
    try {
      // Adicionamos um timestamp para garantir que o navegador não use cache
      const res = await fetch(`/api/superadmin/list-tenants?t=${Date.now()}`);
      const data = await res.json();
      if (data.success) {
        setTenants(data.data || []);
      }
    } catch (error) { 
      console.error('Erro ao buscar:', error); 
    } finally { 
      setLoading(false); 
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingId ? '/api/superadmin/manage' : '/api/superadmin/setup';
    const method = editingId ? 'PUT' : 'POST';
    const body = editingId ? { ...formData, id: editingId } : formData;

    setMessage('Processando...');
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setMessage(editingId ? '✅ Atualizado com sucesso!' : '✅ Criado com sucesso!');
        setFormData({ name: '', slug: '', phone: '', email: '', password: '' });
        setEditingId(null);
        // Recarregar a lista após 1 segundo para dar tempo ao banco
        setTimeout(() => fetchTenants(), 1000);
      } else { 
        setMessage('❌ Erro: ' + data.error); 
      }
    } catch (error) { 
      setMessage('❌ Erro na conexão.'); 
    }
  };

  const handleEdit = (t) => {
    setEditingId(t.id);
    setFormData({ name: t.name, slug: t.slug, phone: t.phone, email: t.email || '', password: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta barbearia?')) return;
    
    // ATUALIZAÇÃO INSTANTÂNEA: Remove da tela antes mesmo da API terminar
    setTenants(prev => prev.filter(t => t.id !== id));
    
    try {
      const res = await fetch(`/api/superadmin/manage?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { 
        setMessage('✅ Excluído com sucesso!'); 
      } else {
        // Se der erro na API, volta a barbearia para a tela
        fetchTenants();
        setMessage('❌ Erro ao excluir no banco.');
      }
    } catch (error) { 
      fetchTenants();
      setMessage('❌ Erro na conexão.'); 
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Painel Super Admin</h1>
      
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>{editingId ? 'Editar Barbearia' : 'Cadastrar Nova Barbearia'}</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <input style={styles.input} placeholder="Nome" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            <input style={styles.input} placeholder="Slug" value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/ /g, '-')})} required />
            <input style={styles.input} placeholder="WhatsApp" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
          </div>
          <div style={{...styles.inputGroup, marginTop: '15px'}}>
            <input style={styles.input} type="email" placeholder="E-mail Admin" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
            <input style={styles.input} type="password" placeholder={editingId ? "Nova Senha (opcional)" : "Senha Admin"} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required={!editingId} />
          </div>
          <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
            <button type="submit" style={styles.button}>{editingId ? 'Salvar Alterações' : 'Criar Barbearia'}</button>
            {editingId && <button type="button" onClick={() => {setEditingId(null); setFormData({ name: '', slug: '', phone: '', email: '', password: '' });}} style={styles.cancelButton}>Cancelar</button>}
          </div>
        </form>
        {message && <p style={styles.message}>{message}</p>}
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Barbearias Ativas ({tenants.length})</h2>
        {loading ? <p>Carregando...</p> : (
          <table style={styles.table}>
            <thead>
              <tr><th style={styles.th}>Nome</th><th style={styles.th}>Slug</th><th style={styles.th}>WhatsApp</th><th style={styles.th}>Ações</th></tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} style={styles.tr}>
                  <td style={styles.td}>{t.name}</td>
                  <td style={styles.td}>/{t.slug}</td>
                  <td style={styles.td}>{t.phone}</td>
                  <td style={styles.td}>
                    <div style={{display: 'flex', gap: '10px'}}>
                      <a href={`/${t.slug}`} target="_blank" style={styles.linkButton}>Ver Site</a>
                      <button onClick={() => handleEdit(t)} style={styles.editButton}>Editar</button>
                      <button onClick={() => handleDelete(t.id)} style={styles.deleteButton}>Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '40px', backgroundColor: '#0A0A0A', minHeight: '100vh', color: '#fff', fontFamily: 'Arial' },
  title: { fontSize: '32px', marginBottom: '30px', color: '#8205ff' },
  card: { backgroundColor: '#111', padding: '20px', borderRadius: '10px', marginBottom: '30px', border: '1px solid #222' },
  cardTitle: { fontSize: '20px', marginBottom: '20px', color: '#fff' },
  form: { display: 'flex', flexDirection: 'column' },
  inputGroup: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  input: { padding: '12px', borderRadius: '5px', border: '1px solid #333', backgroundColor: '#222', color: '#fff', flex: '1', minWidth: '200px' },
  button: { padding: '12px 25px', borderRadius: '5px', border: 'none', backgroundColor: '#8205ff', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },
  cancelButton: { padding: '12px 25px', borderRadius: '5px', border: '1px solid #666', backgroundColor: 'transparent', color: '#666', cursor: 'pointer' },
  editButton: { color: '#ffcc00', background: 'none', border: '1px solid #ffcc00', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' },
  deleteButton: { color: '#ff4d4d', background: 'none', border: '1px solid #ff4d4d', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' },
  linkButton: { color: '#8205ff', textDecoration: 'none', fontWeight: 'bold', border: '1px solid #8205ff', padding: '5px 10px', borderRadius: '5px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #222', color: '#666' },
  td: { padding: '12px', borderBottom: '1px solid #222' },
  tr: { transition: '0.3s' },
  message: { marginTop: '15px', color: '#8205ff', fontWeight: 'bold' }
};