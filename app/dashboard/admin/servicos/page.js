'use client';

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ServicosPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [servicos, setServicos] = useState([
    {
      id: 1,
      nome: "Corte",
      preco: "R$ 50,00",
      duracao: "30 min",
      descricao: "Corte de cabelo padrão",
    },
    {
      id: 2,
      nome: "Corte + Barba",
      preco: "R$ 80,00",
      duracao: "45 min",
      descricao: "Corte de cabelo + aparação de barba",
    },
    {
      id: 3,
      nome: "Barba",
      preco: "R$ 35,00",
      duracao: "20 min",
      descricao: "Aparação e design de barba",
    },
    {
      id: 4,
      nome: "Desenho",
      preco: "R$ 60,00",
      duracao: "25 min",
      descricao: "Desenho e arte na barba",
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    preco: "",
    duracao: "",
    descricao: "",
  });

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
    setServicos(servicos.filter((s) => s.id !== id));
  };

  const handleAddServico = (e) => {
    e.preventDefault();
    if (
      formData.nome &&
      formData.preco &&
      formData.duracao &&
      formData.descricao
    ) {
      setServicos([
        ...servicos,
        {
          id: Math.max(...servicos.map((s) => s.id), 0) + 1,
          ...formData,
        },
      ]);
      setFormData({
        nome: "",
        preco: "",
        duracao: "",
        descricao: "",
      });
      setShowForm(false);
    }
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
          <p style={styles.subtitle}>Gerenciar Serviços</p>
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
          <h2 style={styles.pageTitle}>💼 Serviços</h2>

          {/* Add Button */}
          <button
            onClick={() => setShowForm(!showForm)}
            style={styles.addBtn}
          >
            {showForm ? "Cancelar" : "+ Adicionar Serviço"}
          </button>

          {/* Form */}
          {showForm && (
            <form onSubmit={handleAddServico} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nome do Serviço</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  placeholder="Ex: Corte"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Preço</label>
                  <input
                    type="text"
                    value={formData.preco}
                    onChange={(e) =>
                      setFormData({ ...formData, preco: e.target.value })
                    }
                    placeholder="Ex: R$ 50,00"
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Duração</label>
                  <input
                    type="text"
                    value={formData.duracao}
                    onChange={(e) =>
                      setFormData({ ...formData, duracao: e.target.value })
                    }
                    placeholder="Ex: 30 min"
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Descrição</label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  placeholder="Descrição do serviço"
                  style={{ ...styles.input, minHeight: "80px" }}
                  required
                />
              </div>

              <button type="submit" style={styles.submitBtn}>
                Salvar Serviço
              </button>
            </form>
          )}

          {/* Cards Grid */}
          <div style={styles.cardsGrid}>
            {servicos.map((servico) => (
              <div key={servico.id} style={styles.card}>
                <h3 style={styles.cardTitle}>{servico.nome}</h3>
                <p style={styles.cardPrice}>{servico.preco}</p>
                <p style={styles.cardDuration}>⏱️ {servico.duracao}</p>
                <p style={styles.cardDescription}>{servico.descricao}</p>
                <button
                  onClick={() => handleDelete(servico.id)}
                  style={styles.deleteBtn}
                >
                  Deletar
                </button>
              </div>
            ))}
          </div>

          {servicos.length === 0 && (
            <div style={styles.emptyState}>
              <p>Nenhum serviço cadastrado</p>
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

  addBtn: {
    backgroundColor: "#E50914",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    marginBottom: "20px",
  },

  form: {
    backgroundColor: "#111",
    border: "1px solid #222",
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "30px",
  },

  formGroup: {
    marginBottom: "15px",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },

  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px",
  },

  label: {
    fontSize: "12px",
    fontWeight: "500",
    color: "#E50914",
  },

  input: {
    padding: "10px",
    backgroundColor: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "4px",
    color: "#fff",
    fontSize: "12px",
    fontFamily: "Arial, sans-serif",
  },

  submitBtn: {
    backgroundColor: "#E50914",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
  },

  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "20px",
  },

  card: {
    backgroundColor: "#111",
    border: "1px solid #222",
    borderRadius: "8px",
    padding: "20px",
    textAlign: "center",
  },

  cardTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#E50914",
    margin: "0 0 10px 0",
  },

  cardPrice: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#fff",
    margin: "0 0 5px 0",
  },

  cardDuration: {
    fontSize: "12px",
    color: "#aaa",
    margin: "0 0 10px 0",
  },

  cardDescription: {
    fontSize: "12px",
    color: "#aaa",
    margin: "0 0 15px 0",
  },

  deleteBtn: {
    backgroundColor: "#E50914",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
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
