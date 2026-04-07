'use client';

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AgendamentosPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [agendamentos, setAgendamentos] = useState([
    {
      id: 1,
      cliente: "João Silva",
      telefone: "(12) 99701-7162",
      barbeiro: "Carlos",
      servico: "Corte",
      data: "2024-03-30",
      hora: "10:00",
      status: "confirmado",
    },
    {
      id: 2,
      cliente: "Pedro Santos",
      telefone: "(12) 98765-4321",
      barbeiro: "Carlos",
      servico: "Corte + Barba",
      data: "2024-03-30",
      hora: "11:00",
      status: "confirmado",
    },
    {
      id: 3,
      cliente: "Maria Oliveira",
      telefone: "(12) 97654-3210",
      barbeiro: "Bruno",
      servico: "Corte",
      data: "2024-03-30",
      hora: "14:00",
      status: "pendente",
    },
  ]);

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    if (!role || role !== "admin") {
      window.location.href = "/login";
      return;
    }
    setIsAuthenticated(true);
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_name");
    document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/";
  };

  const handleDelete = (id) => {
    setAgendamentos(agendamentos.filter((a) => a.id !== id));
  };

  const handleStatusChange = (id, newStatus) => {
    setAgendamentos(
      agendamentos.map((a) =>
        a.id === id ? { ...a, status: newStatus } : a
      )
    );
  };

  if (!isAuthenticated || loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingScreen}>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>BarberSaaS</h1>
          <p style={styles.subtitle}>Gerenciar Agendamentos</p>
        </div>
        <div style={styles.headerRight}>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Sair
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        <div style={styles.content}>
          {/* Navigation */}
          <nav style={styles.nav}>
            <Link href="/dashboard/admin" style={styles.navLink}>
              ← Voltar ao Dashboard
            </Link>
          </nav>

          {/* Title */}
          <h2 style={styles.pageTitle}>📅 Agendamentos</h2>

          {/* Table */}
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>Cliente</th>
                  <th style={styles.th}>Telefone</th>
                  <th style={styles.th}>Barbeiro</th>
                  <th style={styles.th}>Serviço</th>
                  <th style={styles.th}>Data</th>
                  <th style={styles.th}>Hora</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {agendamentos.map((agendamento) => (
                  <tr key={agendamento.id} style={styles.tableRow}>
                    <td style={styles.td}>{agendamento.cliente}</td>
                    <td style={styles.td}>{agendamento.telefone}</td>
                    <td style={styles.td}>{agendamento.barbeiro}</td>
                    <td style={styles.td}>{agendamento.servico}</td>
                    <td style={styles.td}>{agendamento.data}</td>
                    <td style={styles.td}>{agendamento.hora}</td>
                    <td style={styles.td}>
                      <select
                        value={agendamento.status}
                        onChange={(e) =>
                          handleStatusChange(agendamento.id, e.target.value)
                        }
                        style={{
                          ...styles.statusSelect,
                          backgroundColor:
                            agendamento.status === "confirmado"
                              ? "#E50914"
                              : "#FFA500",
                        }}
                      >
                        <option value="confirmado">Confirmado</option>
                        <option value="pendente">Pendente</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => handleDelete(agendamento.id)}
                        style={styles.deleteBtn}
                      >
                        Deletar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {agendamentos.length === 0 && (
            <div style={styles.emptyState}>
              <p>Nenhum agendamento encontrado</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#0A0A0A",
    color: "#fff",
  },

  loadingScreen: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    fontSize: "18px",
    color: "#aaa",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 40px",
    borderBottom: "2px solid #E50914",
    backgroundColor: "#000",
  },

  title: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#E50914",
    margin: "0",
    letterSpacing: "2px",
  },

  subtitle: {
    fontSize: "14px",
    color: "#aaa",
    margin: "5px 0 0 0",
  },

  headerRight: {
    display: "flex",
    gap: "20px",
    alignItems: "center",
  },

  logoutBtn: {
    backgroundColor: "#E50914",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },

  main: {
    padding: "40px",
  },

  content: {
    maxWidth: "1200px",
    margin: "0 auto",
  },

  nav: {
    marginBottom: "30px",
  },

  navLink: {
    color: "#E50914",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
  },

  pageTitle: {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "30px",
    color: "#E50914",
  },

  tableContainer: {
    overflowX: "auto",
    backgroundColor: "#111",
    border: "1px solid #222",
    borderRadius: "8px",
    padding: "20px",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  tableHeader: {
    backgroundColor: "#1a1a1a",
    borderBottom: "2px solid #E50914",
  },

  th: {
    padding: "12px",
    textAlign: "left",
    fontSize: "12px",
    fontWeight: "bold",
    color: "#E50914",
  },

  tableRow: {
    borderBottom: "1px solid #222",
  },

  td: {
    padding: "12px",
    fontSize: "12px",
    color: "#aaa",
  },

  statusSelect: {
    padding: "6px 10px",
    borderRadius: "4px",
    border: "none",
    color: "#fff",
    fontSize: "12px",
    cursor: "pointer",
  },

  deleteBtn: {
    backgroundColor: "#E50914",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
  },

  emptyState: {
    textAlign: "center",
    padding: "40px",
    color: "#aaa",
  },
};