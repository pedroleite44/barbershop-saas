'use client';

import { useState, useEffect } from 'react';

export default function HorariosAdmin() {
  const [settings, setSettings] = useState(null);
  const [intervalMinutes, setIntervalMinutes] = useState(30);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('21:00');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const tenantId = 1; // Você pode pegar do contexto/auth

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const response = await fetch(`/api/admin/appointment-settings?tenant_id=${tenantId}`);
      const data = await response.json();
      setSettings(data);
      setIntervalMinutes(data.interval_minutes);
      setStartTime(data.start_time);
      setEndTime(data.end_time);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      setMessage('❌ Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/appointment-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          intervalMinutes: parseInt(intervalMinutes),
          startTime,
          endTime,
        }),
      });

      if (response.ok) {
        setMessage('✅ Configurações salvas com sucesso!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setMessage('❌ Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div style={styles.container}>Carregando...</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>⏰ Configurar Horários de Agendamento</h1>

      <div style={styles.card}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Intervalo de Horários</label>
          <div style={styles.radioGroup}>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                value="15"
                checked={intervalMinutes === 15}
                onChange={(e) => setIntervalMinutes(parseInt(e.target.value))}
              />
              15 minutos
            </label>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                value="30"
                checked={intervalMinutes === 30}
                onChange={(e) => setIntervalMinutes(parseInt(e.target.value))}
              />
              30 minutos
            </label>
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Horário de Início</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Horário de Término</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            style={styles.input}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            ...styles.button,
            opacity: saving ? 0.6 : 1,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>

        {message && <div style={styles.message}>{message}</div>}
      </div>

      <div style={styles.preview}>
        <h2 style={styles.previewTitle}>📋 Prévia dos Horários</h2>
        <div style={styles.timeSlots}>
          {generateTimeSlots(startTime, endTime, intervalMinutes).map((time) => (
            <div key={time} style={styles.timeSlot}>
              {time}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function generateTimeSlots(startTime, endTime, intervalMinutes) {
  const slots = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  let currentHour = startHour;
  let currentMin = startMin;

  const endTotalMin = endHour * 60 + endMin;

  while (currentHour * 60 + currentMin < endTotalMin) {
    const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
    slots.push(timeStr);

    currentMin += intervalMinutes;
    if (currentMin >= 60) {
      currentHour += Math.floor(currentMin / 60);
      currentMin = currentMin % 60;
    }
  }

  return slots;
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0A0A0A',
    color: '#fff',
    padding: '40px 20px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '30px',
    color: '#E50914',
  },
  card: {
    backgroundColor: '#111',
    border: '1px solid #222',
    borderRadius: '8px',
    padding: '30px',
    marginBottom: '30px',
    maxWidth: '500px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#aaa',
  },
  input: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#0A0A0A',
    border: '1px solid #333',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  radioGroup: {
    display: 'flex',
    gap: '20px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  button: {
    backgroundColor: '#E50914',
    color: '#000',
    padding: '12px 24px',
    borderRadius: '4px',
    border: 'none',
    fontWeight: 'bold',
    fontSize: '14px',
    cursor: 'pointer',
    width: '100%',
  },
  message: {
    marginTop: '15px',
    padding: '10px',
    backgroundColor: '#1a3a1a',
    border: '1px solid #4a4',
    borderRadius: '4px',
    fontSize: '14px',
  },
  preview: {
    backgroundColor: '#111',
    border: '1px solid #222',
    borderRadius: '8px',
    padding: '30px',
    maxWidth: '800px',
  },
  previewTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#E50914',
  },
  timeSlots: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
    gap: '10px',
  },
  timeSlot: {
    backgroundColor: '#0A0A0A',
    border: '1px solid #333',
    borderRadius: '4px',
    padding: '10px',
    textAlign: 'center',
    fontSize: '12px',
  },
};