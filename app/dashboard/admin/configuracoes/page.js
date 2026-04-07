'use client';

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ConfiguracoesPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [tenantId, setTenantId] = useState(null);
  
  const [config, setConfig] = useState({
    name: "Black Zone Barbearia",
    phone: "(12) 99701-7162",
    address: "Rua Principal, 123",
    city: "São Paulo",
    state: "SP",
    zip_code: "01234-567",
    opening_time: "09:00",
    closing_time: "19:00",
    description: "Barbearia premium com os melhores barbeiros",
    primary_color: "#E50914",
    secondary_color: "#000",
    accent_color: "#fff",
    logo_url: "",
    banner_url: "",
    appointment_interval: 30,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(config);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [activeTab, setActiveTab] = useState("basicas");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    const authToken = localStorage.getItem("auth_token");
    const tId = localStorage.getItem("tenant_id");
    
    if (!role || role !== "admin" || !authToken) {
      window.location.href = "/login";
      return;
    }
    
    setToken(authToken);
    setTenantId(tId);
    setIsAuthenticated(true);
    
    fetchConfig(authToken, tId);
    setLoading(false);
  }, []);

  async function fetchConfig(authToken, tId) {
    try {
      const response = await fetch("/api/public/settings?tenant_id=" + tId);
      const data = await response.json();
      
      if (data.id) {
        setConfig(data);
        setEditData(data);
      }

      const galleryResponse = await fetch("/api/public/gallery?tenant_id=" + tId);
      const galleryData = await galleryResponse.json();
      setGalleryPhotos(galleryData || []);
    } catch (error) {
      console.error("Erro ao buscar configurações:", error);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_name");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("tenant_id");
    document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/";
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
        },
        body: formData,
      });

      const data = await response.json();

      if (type === "gallery") {
        setGalleryPhotos([...galleryPhotos, data]);
      } else if (type === "banner") {
        setEditData({ ...editData, banner_url: data.url });
      } else if (type === "logo") {
        setEditData({ ...editData, logo_url: data.url });
      }
      setSaveMessage("✅ Upload com sucesso!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      setSaveMessage("❌ Erro ao fazer upload");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!confirm("Tem certeza que deseja deletar esta foto?")) return;

    try {
      const response = await fetch("/api/upload?id=" + photoId, {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + token,
        },
      });

      if (response.ok) {
        setGalleryPhotos(galleryPhotos.filter((p) => p.id !== photoId));
        setSaveMessage("✅ Foto deletada com sucesso!");
        setTimeout(() => setSaveMessage(""), 3000);
      }
    } catch (error) {
      console.error("Erro ao deletar foto:", error);
      setSaveMessage("❌ Erro ao deletar foto");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        setConfig(editData);
        setIsEditing(false);
        setSaveMessage("✅ Configurações salvas com sucesso!");
        setTimeout(() => setSaveMessage(""), 3000);
      } else {
        setSaveMessage("❌ Erro ao salvar configurações");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      setSaveMessage("❌ Erro ao salvar configurações");
    }
  };

  const generateTimeSlots = (startTime, endTime, interval) => {
    const slots = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let currentHour = startHour;
    let currentMin = startMin;
    const endTotalMin = endHour * 60 + endMin;

    while (currentHour * 60 + currentMin < endTotalMin) {
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      slots.push(timeStr);

      currentMin += interval;
      if (currentMin >= 60) {
        currentHour += Math.floor(currentMin / 60);
        currentMin = currentMin % 60;
      }
    }

    return slots;
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
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>BarberSaaS</h1>
          <p style={styles.subtitle}>Configurações</p>
        </div>
        <div style={styles.headerRight}>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Sair
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.content}>
          <nav style={styles.nav}>
            <Link href="/dashboard/admin" style={styles.navLink}>
              ← Voltar ao Dashboard
            </Link>
          </nav>

          <h2 style={styles.pageTitle}>Configurações da Barbearia</h2>

          {saveMessage && (
            <div style={{...styles.message, backgroundColor: saveMessage.includes("✅") ? "#1a3a1a" : "#3a1a1a"}}>
              {saveMessage}
            </div>
          )}

          <div style={styles.tabsContainer}>
            <button
              onClick={() => setActiveTab("basicas")}
              style={{
                ...styles.tabButton,
                ...(activeTab === "basicas" ? styles.tabButtonActive : {})
              }}
            >
              Informações Básicas
            </button>
            <button
              onClick={() => setActiveTab("horarios")}
              style={{
                ...styles.tabButton,
                ...(activeTab === "horarios" ? styles.tabButtonActive : {})
              }}
            >
              ⏰ Horários de Agendamento
            </button>
          </div>

          {activeTab === "basicas" && (
            <>
              <button
                onClick={() => {
                  setIsEditing(!isEditing);
                  setEditData(config);
                }}
                style={styles.editBtn}
              >
                {isEditing ? "Cancelar" : "Editar"}
              </button>

              {!isEditing && (
                <div style={styles.configCard}>
                  <div style={styles.configItem}>
                    <label style={styles.configLabel}>Nome da Barbearia</label>
                    <p style={styles.configValue}>{config.name}</p>
                  </div>

                  <div style={styles.configItem}>
                    <label style={styles.configLabel}>Telefone</label>
                    <p style={styles.configValue}>{config.phone}</p>
                  </div>

                  <div style={styles.configItem}>
                    <label style={styles.configLabel}>Endereço</label>
                    <p style={styles.configValue}>{config.address}, {config.city} - {config.state}</p>
                  </div>

                  <div style={styles.configRow}>
                    <div style={styles.configItem}>
                      <label style={styles.configLabel}>Horário de Abertura</label>
                      <p style={styles.configValue}>{config.opening_time}</p>
                    </div>

                    <div style={styles.configItem}>
                      <label style={styles.configLabel}>Horário de Fechamento</label>
                      <p style={styles.configValue}>{config.closing_time}</p>
                    </div>
                  </div>

                  <div style={styles.configItem}>
                    <label style={styles.configLabel}>Descrição</label>
                    <p style={styles.configValue}>{config.description}</p>
                  </div>

                  <div style={styles.colorsRow}>
                    <div style={styles.colorItem}>
                      <label style={styles.configLabel}>Cor Primária</label>
                      <div style={{...styles.colorPreview, backgroundColor: config.primary_color}}></div>
                      <p style={styles.configValue}>{config.primary_color}</p>
                    </div>

                    <div style={styles.colorItem}>
                      <label style={styles.configLabel}>Cor Secundária</label>
                      <div style={{...styles.colorPreview, backgroundColor: config.secondary_color}}></div>
                      <p style={styles.configValue}>{config.secondary_color}</p>
                    </div>

                    <div style={styles.colorItem}>
                      <label style={styles.configLabel}>Cor Destaque</label>
                      <div style={{...styles.colorPreview, backgroundColor: config.accent_color}}></div>
                      <p style={styles.configValue}>{config.accent_color}</p>
                    </div>
                  </div>
                </div>
              )}

              {isEditing && (
                <form onSubmit={handleSave} style={styles.form}>
                  <h3 style={styles.sectionTitle}>Informações Básicas</h3>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Nome da Barbearia</label>
                    <input
                      type="text"
                      value={editData.name || ""}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      style={styles.input}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Telefone</label>
                    <input
                      type="tel"
                      value={editData.phone || ""}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      style={styles.input}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Endereço</label>
                    <input
                      type="text"
                      value={editData.address || ""}
                      onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                      style={styles.input}
                      required
                    />
                  </div>

                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Cidade</label>
                      <input
                        type="text"
                        value={editData.city || ""}
                        onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                        style={styles.input}
                        required
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Estado</label>
                      <input
                        type="text"
                        value={editData.state || ""}
                        onChange={(e) => setEditData({ ...editData, state: e.target.value })}
                        style={styles.input}
                        maxLength="2"
                        required
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>CEP</label>
                      <input
                        type="text"
                        value={editData.zip_code || ""}
                        onChange={(e) => setEditData({ ...editData, zip_code: e.target.value })}
                        style={styles.input}
                        required
                      />
                    </div>
                  </div>

                  <h3 style={styles.sectionTitle}>Horários</h3>

                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Horário de Abertura</label>
                      <input
                        type="time"
                        value={editData.opening_time || ""}
                        onChange={(e) => setEditData({ ...editData, opening_time: e.target.value })}
                        style={styles.input}
                        required
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Horário de Fechamento</label>
                      <input
                        type="time"
                        value={editData.closing_time || ""}
                        onChange={(e) => setEditData({ ...editData, closing_time: e.target.value })}
                        style={styles.input}
                        required
                      />
                    </div>
                  </div>

                  <h3 style={styles.sectionTitle}>Cores Personalizadas</h3>

                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Cor Primária</label>
                      <div style={styles.colorInputWrapper}>
                        <input
                          type="color"
                          value={editData.primary_color || "#E50914"}
                          onChange={(e) => setEditData({ ...editData, primary_color: e.target.value })}
                          style={styles.colorInput}
                        />
                        <input
                          type="text"
                          value={editData.primary_color || "#E50914"}
                          onChange={(e) => setEditData({ ...editData, primary_color: e.target.value })}
                          style={{...styles.input, flex: 1}}
                        />
                      </div>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Cor Secundária</label>
                      <div style={styles.colorInputWrapper}>
                        <input
                          type="color"
                          value={editData.secondary_color || "#000"}
                          onChange={(e) => setEditData({ ...editData, secondary_color: e.target.value })}
                          style={styles.colorInput}
                        />
                        <input
                          type="text"
                          value={editData.secondary_color || "#000"}
                          onChange={(e) => setEditData({ ...editData, secondary_color: e.target.value })}
                          style={{...styles.input, flex: 1}}
                        />
                      </div>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Cor Destaque</label>
                      <div style={styles.colorInputWrapper}>
                        <input
                          type="color"
                          value={editData.accent_color || "#fff"}
                          onChange={(e) => setEditData({ ...editData, accent_color: e.target.value })}
                          style={styles.colorInput}
                        />
                        <input
                          type="text"
                          value={editData.accent_color || "#fff"}
                          onChange={(e) => setEditData({ ...editData, accent_color: e.target.value })}
                          style={{...styles.input, flex: 1}}
                        />
                      </div>
                    </div>
                  </div>

                  <h3 style={styles.sectionTitle}>Fotos</h3>

                  <div style={styles.uploadSection}>
                    <div style={styles.uploadBox}>
                      <label style={styles.uploadLabel}>Logo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "logo")}
                        style={styles.fileInput}
                        disabled={uploadLoading}
                      />
                      {editData.logo_url && (
                        <img src={editData.logo_url} alt="Logo" style={styles.uploadPreview} />
                      )}
                    </div>

                    <div style={styles.uploadBox}>
                      <label style={styles.uploadLabel}>Banner</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "banner")}
                        style={styles.fileInput}
                        disabled={uploadLoading}
                      />
                      {editData.banner_url && (
                        <img src={editData.banner_url} alt="Banner" style={styles.uploadPreview} />
                      )}
                    </div>

                    <div style={styles.uploadBox}>
                      <label style={styles.uploadLabel}>Galeria</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "gallery")}
                        style={styles.fileInput}
                        disabled={uploadLoading}
                      />
                    </div>
                  </div>

                  {galleryPhotos.length > 0 && (
                    <div style={styles.galleryPreview}>
                      <h4 style={styles.galleryTitle}>Fotos da Galeria</h4>
                      <div style={styles.galleryGrid}>
                        {galleryPhotos.map((photo) => (
                          <div key={photo.id} style={styles.galleryItemContainer}>
                            <img src={photo.image_url} alt="Galeria" style={styles.galleryItemImage} />
                            <button
                              type="button"
                              onClick={() => handleDeletePhoto(photo.id)}
                              style={styles.deleteBtn}
                            >
                              Deletar
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <h3 style={styles.sectionTitle}>Descrição</h3>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Descrição da Barbearia</label>
                    <textarea
                      value={editData.description || ""}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      style={{ ...styles.input, minHeight: "100px" }}
                      required
                    />
                  </div>

                  <button type="submit" style={styles.submitBtn} disabled={uploadLoading}>
                    {uploadLoading ? "Enviando..." : "Salvar Alterações"}
                  </button>
                </form>
              )}
            </>
          )}

          {activeTab === "horarios" && (
            <div style={styles.form}>
              <h3 style={styles.sectionTitle}>⏰ Configurar Intervalo de Agendamento</h3>

              <div style={styles.formGroup}>
                <label style={styles.label}>Intervalo entre Atendimentos</label>
                <p style={{...styles.configValue, marginBottom: "15px"}}>
                  Escolha o intervalo de tempo entre cada agendamento
                </p>
                <div style={styles.radioGroup}>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      value="15"
                      checked={editData.appointment_interval === 15}
                      onChange={(e) => setEditData({ ...editData, appointment_interval: parseInt(e.target.value) })}
                      style={styles.radioInput}
                    />
                    <span>15 minutos</span>
                  </label>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      value="30"
                      checked={editData.appointment_interval === 30}
                      onChange={(e) => setEditData({ ...editData, appointment_interval: parseInt(e.target.value) })}
                      style={styles.radioInput}
                    />
                    <span>30 minutos</span>
                  </label>
                </div>
              </div>

              <div style={styles.previewSection}>
                <h4 style={styles.previewTitle}>📋 Prévia dos Horários Disponíveis</h4>
                <p style={{fontSize: "12px", color: "#aaa", marginBottom: "15px"}}>
                  Intervalo: <strong>{editData.appointment_interval} minutos</strong> | Horário: {editData.opening_time} às {editData.closing_time}
                </p>
                <div style={styles.timeSlotGrid}>
                  {generateTimeSlots(editData.opening_time || "09:00", editData.closing_time || "21:00", editData.appointment_interval || 30).map((time) => (
                    <div key={time} style={styles.timeSlot}>
                      {time}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSave}
                style={styles.submitBtn}
              >
                Salvar Configurações de Horários
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", backgroundColor: "#0A0A0A", color: "#fff" },
  loadingScreen: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontSize: "18px", color: "#aaa" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", borderBottom: "2px solid #E50914", backgroundColor: "#000" },
  title: { fontSize: "28px", fontWeight: "bold", color: "#E50914", margin: "0", letterSpacing: "2px" },
  subtitle: { fontSize: "14px", color: "#aaa", margin: "5px 0 0 0" },
  headerRight: { display: "flex", gap: "20px", alignItems: "center" },
  logoutBtn: { backgroundColor: "#E50914", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "4px", cursor: "pointer", fontSize: "14px", fontWeight: "500" },
  main: { padding: "40px" },
  content: { maxWidth: "900px", margin: "0 auto" },
  nav: { marginBottom: "30px" },
  navLink: { color: "#E50914", textDecoration: "none", fontSize: "14px", fontWeight: "500" },
  pageTitle: { fontSize: "24px", fontWeight: "bold", marginBottom: "30px", color: "#E50914" },
  message: { padding: "15px", borderRadius: "4px", marginBottom: "20px", fontSize: "14px", textAlign: "center", border: "1px solid #4a4" },
  tabsContainer: { display: "flex", gap: "10px", marginBottom: "30px", borderBottom: "2px solid #222", paddingBottom: "10px" },
  tabButton: { padding: "10px 20px", backgroundColor: "transparent", border: "none", color: "#aaa", cursor: "pointer", fontSize: "14px", fontWeight: "500", borderBottom: "3px solid transparent", transition: "all 0.3s" },
  tabButtonActive: { color: "#E50914", borderBottomColor: "#E50914" },
  editBtn: { backgroundColor: "#E50914", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "4px", cursor: "pointer", fontSize: "14px", fontWeight: "500", marginBottom: "20px" },
  configCard: { backgroundColor: "#111", border: "1px solid #222", borderRadius: "8px", padding: "30px" },
  configItem: { marginBottom: "20px" },
  configRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" },
  colorsRow: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginTop: "20px" },
  colorItem: { textAlign: "center" },
  colorPreview: { width: "100%", height: "80px", borderRadius: "8px", marginBottom: "10px", border: "1px solid #333" },
  configLabel: { fontSize: "12px", fontWeight: "500", color: "#E50914", marginBottom: "5px", display: "block" },
  configValue: { fontSize: "14px", color: "#aaa", margin: "0" },
  form: { backgroundColor: "#111", border: "1px solid #222", borderRadius: "8px", padding: "30px" },
  sectionTitle: { fontSize: "16px", fontWeight: "bold", color: "#E50914", marginTop: "30px", marginBottom: "20px", borderBottom: "1px solid #222", paddingBottom: "10px" },
  formGroup: { marginBottom: "20px", display: "flex", flexDirection: "column", gap: "5px" },
  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" },
  label: { fontSize: "12px", fontWeight: "500", color: "#E50914" },
  input: { padding: "10px", backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "4px", color: "#fff", fontSize: "12px", fontFamily: "Arial, sans-serif" },
  colorInputWrapper: { display: "flex", gap: "10px", alignItems: "center" },
  colorInput: { width: "50px", height: "40px", border: "1px solid #333", borderRadius: "4px", cursor: "pointer" },
  uploadSection: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "20px" },
  uploadBox: { backgroundColor: "#1a1a1a", border: "2px dashed #333", borderRadius: "8px", padding: "20px", textAlign: "center" },
  uploadLabel: { fontSize: "12px", fontWeight: "500", color: "#E50914", display: "block", marginBottom: "10px" },
  fileInput: { display: "block", width: "100%", marginBottom: "10px", color: "#aaa" },
  uploadPreview: { maxWidth: "100%", maxHeight: "100px", borderRadius: "4px", marginTop: "10px" },
  galleryPreview: { marginTop: "30px" },
  galleryTitle: { fontSize: "14px", fontWeight: "bold", color: "#E50914", marginBottom: "15px" },
  galleryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "15px" },
  galleryItemContainer: { position: "relative", borderRadius: "8px", overflow: "hidden" },
  galleryItemImage: { width: "100%", height: "150px", objectFit: "cover" },
  deleteBtn: { position: "absolute", bottom: "5px", right: "5px", backgroundColor: "#E50914", color: "#fff", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" },
  submitBtn: { backgroundColor: "#E50914", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "4px", cursor: "pointer", fontSize: "14px", fontWeight: "500", width: "100%", marginTop: "30px" },
  radioGroup: { display: "flex", gap: "30px", marginTop: "10px" },
  radioLabel: { display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px", color: "#fff" },
  radioInput: { width: "18px", height: "18px", cursor: "pointer", accentColor: "#E50914" },
  previewSection: { marginTop: "30px", padding: "20px", backgroundColor: "#1a1a1a", borderRadius: "8px", border: "1px solid #333" },
  previewTitle: { fontSize: "14px", fontWeight: "bold", color: "#E50914", marginBottom: "15px" },
  timeSlotGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "10px" },
  timeSlot: { padding: "10px", backgroundColor: "#0A0A0A", border: "1px solid #E50914", borderRadius: "4px", textAlign: "center", fontSize: "12px", fontWeight: "bold", color: "#E50914" },
};