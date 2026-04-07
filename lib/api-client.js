'use client';

export async function apiCall(url, options = {}) {
  try {
    const token = localStorage.getItem('token');       

    if (!token) {
      throw new Error('Token não encontrado. Faça login novamente.');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': Bearer ${token},
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
        throw new Error('Sessão expirada. Faça login novamente.');
      }
      throw new Error(Erro ${response.status}: ${response.statusText});
    }

    return await response.json();
  } catch (error) {
    console.error('Erro na requisição:', error);
    throw error;
  }
}