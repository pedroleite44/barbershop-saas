'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { Calendar, Clock, User, Phone, CheckCircle2, XCircle, Search, Scissors } from 'lucide-react';

function DashboardContent() {
  // CORREÇÃO: Adicionamos um valor padrão = {} para evitar o erro de undefined no build
  const { data: session, status } = useSession() || {};
  
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Verificamos se session e session.user existem antes de acessar tenant_id
    if (status === 'authenticated' && session?.user?.tenant_id) {
      fetchAppointments();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status, session, filter]);

  async function fetchAppointments() {
    try {
      setLoading(true);
      // CORREÇÃO: Uso de optional chaining para segurança
      const tenantId = session?.user?.tenant_id;
      const barberId = session?.user?.role === 'barber' ? session?.user?.id : '';
      
      if (!tenantId) return;

      const res = await fetch(`/api/appointments/me?tenant_id=${tenantId}&barber_id=${barberId}&t=${Date.now()}`);
      const data = await res.json();
      
      if (data.success) {
        setAppointments(data.data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  }

  // ... (resto do seu código de updateStatus e filteredAppointments permanece igual)

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/appointments/update-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setAppointments(prev => prev.map(app => app.id === id ? { ...app, status: newStatus } : app));
      }
    } catch (error) {
      alert('Erro ao atualizar status.');
    }
  };

  const filteredAppointments = appointments.filter(app => {
    const matchesSearch = (app.client_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (app.phone || '').includes(searchTerm);
    const matchesFilter = filter === 'all' || app.status === filter;
    return matchesSearch && matchesFilter;
  });

  // CORREÇÃO: Se não estiver autenticado e não estiver carregando, mostra aviso ou redireciona
  if (status === 'loading' || loading) return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#8205ff]"></div>
    </div>
  );

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">
        <p>Acesso negado. Por favor, faça login.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-4 md:p-8">
      {/* ... (seu JSX do dashboard) */}
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Scissors className="mr-3 text-[#8205ff]" /> Meus Agendamentos
            </h1>
            <p className="text-gray-500 mt-1">Gerencie os horários da sua barbearia</p>
          </div>
          {/* ... resto do seu JSX ... */}
        </div>
        {/* ... (mantenha o restante do seu código aqui) ... */}
      </div>
    </div>
  );
}

export default function AppointmentsDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Carregando dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
