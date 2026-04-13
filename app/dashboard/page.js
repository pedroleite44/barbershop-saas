'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { Calendar, Clock, User, Phone, CheckCircle2, XCircle, Search, Scissors } from 'lucide-react';

function DashboardContent() {
  const { data: session, status } = useSession();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.tenant_id) {
      fetchAppointments();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status, session, filter]);

  async function fetchAppointments() {
    try {
      setLoading(true);
      const tenantId = session.user.tenant_id;
      const barberId = session.user.role === 'barber' ? session.user.id : '';
      
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

  if (status === 'loading' || loading) return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#8205ff]"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Scissors className="mr-3 text-[#8205ff]" /> Meus Agendamentos
            </h1>
            <p className="text-gray-500 mt-1">Gerencie os horários da sua barbearia</p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Buscar cliente ou telefone..." 
              className="bg-[#111] border border-gray-800 rounded-xl py-2 pl-10 pr-4 outline-none focus:border-[#8205ff] transition-all w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'pending', 'confirmed', 'cancelled'].map((f) => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-full font-bold capitalize transition-all whitespace-nowrap ${filter === f ? 'bg-[#8205ff] text-white' : 'bg-[#111] text-gray-500 border border-gray-800 hover:border-gray-600'}`}
            >
              {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendentes' : f === 'confirmed' ? 'Confirmados' : 'Cancelados'}
            </button>
          ))}
        </div>

        <div className="grid gap-4">
          {filteredAppointments.length === 0 ? (
            <div className="bg-[#111] border border-gray-800 rounded-3xl p-12 text-center text-gray-500">
              Nenhum agendamento encontrado.
            </div>
          ) : (
            filteredAppointments.map((app) => (
              <div key={app.id} className="bg-[#111] border border-gray-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-gray-700 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#8205ff]/10 rounded-full flex items-center justify-center text-[#8205ff]">
                    <User size={24} />
                  </div>
                  <div>
                    {/* NOME E TELEFONE DO CLIENTE */}
                    <h3 className="font-bold text-lg text-white">{app.client_name || 'Cliente Sem Nome'}</h3>
                    <p className="text-sm text-green-500 font-mono flex items-center mt-0.5">
                      <Phone size={12} className="mr-1" /> {app.phone || 'Sem Telefone'}
                    </p>
                    <div className="flex items-center text-xs text-gray-500 gap-3 mt-2">
                      <span className="flex items-center"><Calendar size={14} className="mr-1" /> {new Date(app.date).toLocaleDateString('pt-BR')}</span>
                      <span className="flex items-center"><Clock size={14} className="mr-1" /> {app.time}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:items-center bg-black/20 p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] text-gray-500 uppercase font-bold mb-1">Serviços Selecionados</span>
                  <span className="font-bold text-[#8205ff] text-sm text-center max-w-[200px]">
                    {app.service_name || 'Nenhum serviço'}
                  </span>
                </div>

                <div className="flex flex-col md:items-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    app.status === 'confirmed' ? 'bg-green-500/10 text-green-500' : 
                    app.status === 'cancelled' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                  }`}>
                    {app.status === 'confirmed' ? 'Confirmado' : app.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                  </span>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  {app.status === 'pending' && (
                    <>
                      <button onClick={() => updateStatus(app.id, 'confirmed')} className="flex-1 md:flex-none bg-green-500 hover:bg-green-600 text-white p-2 rounded-xl transition-all"><CheckCircle2 size={20} className="mx-auto" /></button>
                      <button onClick={() => updateStatus(app.id, 'cancelled')} className="flex-1 md:flex-none bg-red-500 hover:bg-red-600 text-white p-2 rounded-xl transition-all"><XCircle size={20} className="mx-auto" /></button>
                    </>
                  )}
                  <a href={`https://wa.me/55${(app.phone || '' ).replace(/\D/g,'')}`} target="_blank" className="flex-1 md:flex-none bg-[#25D366] hover:bg-[#128C7E] text-white p-2 rounded-xl transition-all text-center"><Phone size={20} className="mx-auto" /></a>
                </div>
              </div>
            ))
          )}
        </div>
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