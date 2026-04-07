"use client";

import { useState, useEffect } from 'react';

export default function ConfigPage() {
  const [settings, setSettings] = useState(null);
  const [editSettings, setEditSettings] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    const tenantId = localStorage.getItem('tenant_id');
    const res = await fetch('/api/settings?tenant_id=' + tenantId);
    const data = await res.json();
    setSettings(data);
    setEditSettings(data);
  }

  async function handleSave(e) {
    e.preventDefault();

    const token = localStorage.getItem('token');
    const tenantId = localStorage.getItem('tenant_id');

    await fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify(editSettings),
    });

    alert('Salvo com sucesso!');
    setIsEditing(false);
    fetchSettings();
  }

  return (
    <div style={{ padding: 40, background: '#000', minHeight: '100vh', color: '#fff' }}>
      <h1 style={{ color: '#E50914' }}>Configurações</h1>

      {!isEditing && settings && (
        <div>
          <p><b>Nome:</b> {settings.name}</p>
          <p><b>Telefone:</b> {settings.phone}</p>
          <p><b>WhatsApp:</b> {settings.whatsapp || '-'}</p>

          <button onClick={() => setIsEditing(true)}>
            Editar
          </button>
        </div>
      )}

      {isEditing && (
        <form onSubmit={handleSave}>
          <input
            placeholder="Nome"
            value={editSettings.name || ''}
            onChange={(e) => setEditSettings({ ...editSettings, name: e.target.value })}
          />

          <input
            placeholder="Telefone"
            value={editSettings.phone || ''}
            onChange={(e) => setEditSettings({ ...editSettings, phone: e.target.value })}
          />

          <input
            placeholder="WhatsApp (ex: 5511999999999)"
            value={editSettings.whatsapp || ''}
            onChange={(e) => setEditSettings({ ...editSettings, whatsapp: e.target.value })}
          />

          <button type="submit">
            Salvar
          </button>
        </form>
      )}
    </div>
  );
}
