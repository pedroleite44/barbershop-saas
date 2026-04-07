'use client';

import { useState, useEffect } from 'react';

export default function LandingPage() {
  const [settings, setSettings] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [barbers, setBarbers] = useState([]);
  const [tenantId, setTenantId] = useState(null);

  useEffect(() => {
    const subdomain = window.location.hostname.split('.')[0];
    const subdomainMap = {
      'blackzone': 1,
      'premiumcuts': 2,
      'barbershop': 3,
    };
    const id = subdomainMap[subdomain] || 1;
    setTenantId(id);
    
    fetchData(id);
  }, []);

  async function fetchData(id) {
    try {
      const settingsResponse = await fetch(`/api/public/settings?tenant_id=${id}`);
      const settingsData = await settingsResponse.json();
      setSettings(settingsData.data || settingsData);

      const galleryResponse = await fetch(`/api/public/gallery?tenant_id=${id}`);
      const galleryData = await galleryResponse.json();
      setGallery(galleryData.data || []);

      const barbersResponse = await fetch(`/api/public/barbers?tenant_id=${id}`);
      const barbersData = await barbersResponse.json();
      setBarbers(barbersData.data || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleAgendar = () => {
    window.location.href = '/agendamento/agendar';
  };

  const handleConhecerMais = () => {
    const servicesSection = document.getElementById('services');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleInstagram = () => {
    window.open('https://instagram.com', '_blank'  );
  };

  if (loading) {
    return <div style={styles.loading}>Carregando...</div>;
  }

  if (!settings) {
    return <div style={styles.loading}>Erro ao carregar configurações</div>;
  }

  const primaryColor = settings.primary_color || '#E50914';
  const secondaryColor = settings.secondary_color || '#000';
  const accentColor = settings.accent_color || '#fff';

  const dynamicStyles = {
    ...styles,
    container: { ...styles.container, backgroundColor: secondaryColor },
    header: { ...styles.header, backgroundColor: secondaryColor, borderBottomColor: primaryColor },
    logo: { ...styles.logo, color: primaryColor },
    headerTitle: { ...styles.headerTitle, color: primaryColor },
    heroTitleRed: { ...styles.heroTitleRed, color: primaryColor },
    buttonPrimary: { ...styles.buttonPrimary, backgroundColor: primaryColor, color: accentColor },
    buttonSecondary: { ...styles.buttonSecondary, color: primaryColor, borderColor: primaryColor, backgroundColor: accentColor },
    sectionTitle: { ...styles.sectionTitle, color: primaryColor },
    serviceCardHighlight: { ...styles.serviceCardHighlight, borderColor: primaryColor, backgroundColor: accentColor },
    servicePrice: { ...styles.servicePrice, color: primaryColor },
    teamRole: { ...styles.teamRole, color: primaryColor },
    ctaTitleRed: { ...styles.ctaTitleRed, color: primaryColor },
    ctaButtonPrimary: { ...styles.ctaButtonPrimary, backgroundColor: primaryColor, color: accentColor },
    ctaButtonSecondary: { ...styles.ctaButtonSecondary, color: primaryColor, borderColor: primaryColor, backgroundColor: accentColor },
    hero: { ...styles.hero, backgroundColor: secondaryColor },
    services: { ...styles.services, backgroundColor: secondaryColor },
    gallery: { ...styles.gallery, backgroundColor: secondaryColor },
    team: { ...styles.team, backgroundColor: secondaryColor },
    finalCta: { ...styles.finalCta, backgroundColor: secondaryColor },
    cutsGallery: {
    padding: '80px 40px',
    backgroundColor: '#000',
  },
  cutsSubtitle: {
    textAlign: 'center',
    fontSize: '16px',
    color: '#aaa',
    marginBottom: '60px',
  },
  cutsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  cutsItem: {
    position: 'relative',
    borderRadius: '8px',
    overflow: 'hidden',
    height: '300px',
    cursor: 'pointer',
    transition: 'transform 0.3s ease',
  },
  cutsImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
  },
  cutsTitle: {
    position: 'absolute',
    bottom: '0',
    left: '0',
    right: '0',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: '#fff',
    padding: '15px',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  footer: { ...styles.footer, backgroundColor: secondaryColor },
    cutsGallery: { ...styles.cutsGallery, backgroundColor: secondaryColor },
  };

  return (
    <div style={dynamicStyles.container}>
      {/* Header */}
      <header style={dynamicStyles.header}>
        <div style={styles.headerLeft}>
          {settings.logo_url ? (
            <img src={settings.logo_url} alt="Logo" style={styles.logoImage} />
          ) : (
            <div style={dynamicStyles.logo}>{settings.name || 'BarberSaaS'}</div>
          )}
        </div>
        <div style={styles.placeholder} />
      </header>

      {/* Hero Section */}
      <section style={dynamicStyles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>
            CORTE  
            <span style={dynamicStyles.heroTitleRed}>PERFEITO</span>
          </h1>
          <p style={styles.heroSubtitle}>
            {settings.description || 'A maior rede de barbearia do Brasil. Qualidade, preço justo e experiência premium em cada corte.'}
          </p>
          <div style={styles.heroButtons}>
            <button style={dynamicStyles.buttonPrimary} onClick={handleAgendar}>
              Agendar Agora →
            </button>
            <button style={dynamicStyles.buttonSecondary} onClick={handleConhecerMais}>
              Conhecer Mais
            </button>
          </div>
        </div>
        <div style={styles.heroImage}>
          {settings.banner_url ? (
            <img src={settings.banner_url} alt="Banner" style={styles.heroImageActual} />
          ) : (
            <div style={styles.heroImagePlaceholder}>👨‍💼</div>
          )}
        </div>
      </section>

      {/* Services Section */}
      <section id="services" style={dynamicStyles.services}>
        <h2 style={dynamicStyles.sectionTitle}>NOSSOS SERVIÇOS</h2>
        <div style={styles.servicesGrid}>
          <div style={styles.serviceCard}>
            <div style={styles.serviceIcon}>✂️</div>
            <h3 style={styles.serviceName}>Corte</h3>
            <p style={styles.serviceDesc}>Corte preciso com técnica profissional</p>
            <div style={dynamicStyles.servicePrice}>A partir de R$ 50</div>
          </div>
          <div style={styles.serviceCard}>
            <div style={styles.serviceIcon}>💧</div>
            <h3 style={styles.serviceName}>Barberoterapia</h3>
            <p style={styles.serviceDesc}>Toalha quente, hidratação e relaxamento</p>
            <div style={dynamicStyles.servicePrice}>R$ 55</div>
          </div>
          <div style={{ ...styles.serviceCard, ...dynamicStyles.serviceCardHighlight }}>
            <div style={styles.serviceIcon}>⭐</div>
            <h3 style={styles.serviceName}>Combo Premium</h3>
            <p style={styles.serviceDesc}>Corte + Barba + Barberoterapia</p>
            <div style={dynamicStyles.servicePrice}>R$ 100</div>
          </div>
          <div style={styles.serviceCard}>
            <div style={styles.serviceIcon}>💇</div>
            <h3 style={styles.serviceName}>Sobrancelha</h3>
            <p style={styles.serviceDesc}>Design e alinhamento perfeito</p>
            <div style={dynamicStyles.servicePrice}>R$ 15</div>
          </div>
        </div>
      </section>

      {/* Nossos Cortes Section */}
      {gallery.length > 0 && (
        <section style={dynamicStyles.cutsGallery}>
          <h2 style={dynamicStyles.sectionTitle}>NOSSOS CORTES</h2>
          <p style={styles.cutsSubtitle}>Confira os melhores trabalhos da nossa equipe</p>
          <div style={styles.cutsGrid}>
            {gallery.map((photo) => (
              <div key={photo.id} style={styles.cutsItem}>
                <img src={photo.image_url} alt={photo.title || 'Corte'} style={styles.cutsImage} />
                {photo.title && <div style={styles.cutsTitle}>{photo.title}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Team Section - Conectado ao banco de dados */}
      {barbers.length > 0 && (
        <section style={dynamicStyles.team}>
          <h2 style={dynamicStyles.sectionTitle}>NOSSA EQUIPE</h2>
          <p style={styles.teamSubtitle}>Profissionais experientes e dedicados ao seu estilo</p>
          <div style={styles.teamMembers}>
            {barbers.map((barber) => (
              <div key={barber.id} style={styles.teamMember}>
                <div style={styles.teamPhoto}>👨‍💼</div>
                <h3 style={styles.teamName}>{barber.name}</h3>
                <p style={dynamicStyles.teamRole}>Barbeiro Profissional</p>
                <p style={styles.teamSpecialty}>{barber.specialty || 'Especializado em cortes modernos e tradicionais'}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Final CTA Section */}
      <section style={dynamicStyles.finalCta}>
        <h2 style={styles.ctaTitle}>
          PRONTO PARA SEU  
          <span style={dynamicStyles.ctaTitleRed}>MELHOR CORTE?</span>
        </h2>
        <p style={styles.ctaSubtitle}>
          Agende agora mesmo e experimente a qualidade premium. Estamos abertos de segunda a sábado, das {settings.opening_time || '9h'} às {settings.closing_time || '21h'}
        </p>
        <div style={styles.ctaButtons}>
          <button style={dynamicStyles.ctaButtonPrimary} onClick={handleAgendar}>
            Agendar Agora →
          </button>
          <button style={dynamicStyles.ctaButtonSecondary} onClick={handleInstagram}>
            Seguir no Instagram
          </button>
        </div>

        {/* Contact Info */}
        <div style={styles.contactInfo}>
          <div style={styles.contactCard}>
            <div style={styles.contactIcon}>📍</div>
            <div style={styles.contactLabel}>Localização</div>
            <div style={styles.contactValue}>
              {settings.address && `${settings.address}, ${settings.city}`}
            </div>
          </div>
          <div style={styles.contactCard}>
            <div style={styles.contactIcon}>📞</div>
            <div style={styles.contactLabel}>Telefone</div>
            <div style={styles.contactValue}>{settings.phone || 'Não informado'}</div>
          </div>
          <div style={styles.contactCard}>
            <div style={styles.contactIcon}>⏰</div>
            <div style={styles.contactLabel}>Horário</div>
            <div style={styles.contactValue}>
              Seg-Sab: {settings.opening_time || '9h'} - {settings.closing_time || '21h'}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={dynamicStyles.footer}>
        <p>© 2024 BarberSaaS. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

const styles = {
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  logoImage: {
    height: '40px',
    width: 'auto',
    maxWidth: '200px',
  },
  container: {
    width: '100%',
    minHeight: '100vh',
    backgroundColor: '#000',
    color: '#fff',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    overflow: 'hidden',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#000',
    color: '#fff',
    fontSize: '18px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 40px',
    backgroundColor: '#000',
    borderBottom: '2px solid #E50914',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#E50914',
  },
  headerTitle: {
    fontSize: '20px',
    color: '#E50914',
  },
  placeholder: {
    width: '100px',
  },
  hero: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '80px 40px',
    backgroundColor: '#000',
    gap: '60px',
  },
  heroContent: {
    flex: 1,
    maxWidth: '600px',
  },
  heroTitle: {
    fontSize: '56px',
    fontWeight: 'bold',
    marginBottom: '20px',
    lineHeight: '1.2',
    color: '#fff',
  },
  heroTitleRed: {
    color: '#E50914',
  },
  heroSubtitle: {
    fontSize: '18px',
    color: '#aaa',
    marginBottom: '30px',
    lineHeight: '1.6',
  },
  heroButtons: {
    display: 'flex',
    gap: '15px',
  },
  buttonPrimary: {
    backgroundColor: '#E50914',
    color: '#fff',
    border: 'none',
    padding: '15px 30px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  buttonSecondary: {
    backgroundColor: '#fff',
    color: '#E50914',
    border: '2px solid #E50914',
    padding: '15px 30px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  heroImage: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImagePlaceholder: {
    fontSize: '120px',
  },
  heroImageActual: {
    maxWidth: '100%',
    height: '500px',
    objectFit: 'cover',
    borderRadius: '8px',
  },
  services: {
    padding: '80px 40px',
    backgroundColor: '#000',
  },
  sectionTitle: {
    fontSize: '42px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '60px',
    color: '#E50914',
  },
  servicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '30px',
  },
  serviceCard: {
    backgroundColor: '#111',
    padding: '30px',
    borderRadius: '8px',
    border: '1px solid #222',
    textAlign: 'center',
  },
  serviceCardHighlight: {
    borderColor: '#E50914',
    backgroundColor: '#fff',
  },
  serviceIcon: {
    fontSize: '48px',
    marginBottom: '15px',
  },
  serviceName: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#fff',
  },
  serviceDesc: {
    fontSize: '14px',
    color: '#aaa',
    marginBottom: '15px',
  },
  servicePrice: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#E50914',
  },
  gallery: {
    padding: '80px 40px',
    backgroundColor: '#000',
  },
  galleryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  galleryItem: {
    borderRadius: '8px',
    overflow: 'hidden',
    height: '250px',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  team: {
    padding: '80px 40px',
    backgroundColor: '#000',
  },
  teamSubtitle: {
    textAlign: 'center',
    fontSize: '16px',
    color: '#aaa',
    marginBottom: '60px',
  },
  teamMembers: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '30px',
    marginBottom: '60px',
  },
  teamMember: {
    backgroundColor: '#111',
    padding: '30px',
    borderRadius: '8px',
    border: '1px solid #222',
    textAlign: 'center',
  },
  teamPhoto: {
    fontSize: '80px',
    marginBottom: '15px',
  },
  teamName: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#fff',
  },
  teamRole: {
    fontSize: '14px',
    color: '#E50914',
    marginBottom: '8px',
    fontWeight: 'bold',
  },
  teamSpecialty: {
    fontSize: '13px',
    color: '#aaa',
  },
  finalCta: {
    padding: '80px 40px',
    backgroundColor: '#000',
    textAlign: 'center',
  },
  ctaTitle: {
    fontSize: '48px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#fff',
  },
  ctaTitleRed: {
    color: '#E50914',
  },
  ctaSubtitle: {
    fontSize: '18px',
    color: '#aaa',
    marginBottom: '40px',
    maxWidth: '600px',
    margin: '0 auto 40px',
  },
  ctaButtons: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    marginBottom: '60px',
  },
  ctaButtonPrimary: {
    backgroundColor: '#E50914',
    color: '#fff',
    border: 'none',
    padding: '15px 30px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  ctaButtonSecondary: {
    backgroundColor: '#fff',
    color: '#E50914',
    border: '2px solid #E50914',
    padding: '15px 30px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  contactInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '30px',
    marginTop: '40px',
  },
  contactCard: {
    backgroundColor: '#111',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #222',
  },
  contactIcon: {
    fontSize: '32px',
    marginBottom: '10px',
  },
  contactLabel: {
    fontSize: '14px',
    color: '#aaa',
    marginBottom: '5px',
  },
  contactValue: {
    fontSize: '16px',
    color: '#fff',
    fontWeight: 'bold',
  },
  cutsGallery: {
    padding: '80px 40px',
    backgroundColor: '#000',
  },
  cutsSubtitle: {
    textAlign: 'center',
    fontSize: '16px',
    color: '#aaa',
    marginBottom: '60px',
  },
  cutsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  cutsItem: {
    position: 'relative',
    borderRadius: '8px',
    overflow: 'hidden',
    height: '300px',
    cursor: 'pointer',
    transition: 'transform 0.3s ease',
  },
  cutsImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
  },
  cutsTitle: {
    position: 'absolute',
    bottom: '0',
    left: '0',
    right: '0',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: '#fff',
    padding: '15px',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  footer: {
    padding: '40px',
    backgroundColor: '#000',
    textAlign: 'center',
    borderTop: '1px solid #222',
    color: '#aaa',
  },
};