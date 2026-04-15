'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao fazer login');
        return;
      }

      // ✅ SALVAR TOKEN NO LOCALSTORAGE
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('tenant_id', data.user.tenant_id);
      localStorage.setItem('tenant_name', data.user.tenant_name);

      // ✅ REDIRECIONAR BASEADO NO ROLE
      if (data.user.role === 'admin') {
        router.push('/dashboard/admin');
      } else {
        router.push('/dashboard/barbeiro');
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <h1 style={styles.title}>BarberSaaS</h1>
        <p style={styles.subtitle}>Painel do Barbeiro</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div style={styles.testAccounts}>
          <p style={styles.testTitle}></p>
          <p style={styles.testAccount}></p>
          <p style={styles.testAccount}></p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#000',
    fontFamily: 'Arial, sans-serif',
  },
  loginBox: {
    backgroundColor: '#111',
    border: '1px solid #222',
    borderRadius: '8px',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#E50914',
    margin: '0 0 10px 0',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '14px',
    color: '#aaa',
    margin: '0 0 30px 0',
    textAlign: 'center',
  },
  error: {
    backgroundColor: '#FF6B6B',
    color: '#000',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '13px',
    color: '#aaa',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#E50914',
    color: '#000',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    fontSize: '14px',
    cursor: 'pointer',
  },
  testAccounts: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #222',
    borderRadius: '4px',
    padding: '15px',
    marginTop: '20px',
  },
  testTitle: {
    fontSize: '12px',
    color: '#E50914',
    marginBottom: '10px',
    fontWeight: 'bold',
  },
  testAccount: {
    fontSize: '12px',
    color: '#aaa',
    marginBottom: '8px',
    fontFamily: 'monospace',
  },
};
