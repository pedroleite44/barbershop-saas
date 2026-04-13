'use client';

import { useState, useEffect } from 'react';

export default function LandingPage() {
  const [settings, setSettings] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [tenantId, setTenantId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    const pathParts = window.location.pathname.split('/');
    const slugFromUrl = pathParts[1];
    
    // Lógica de busca robusta do Arquivo 1
    if (slugFromUrl && slugFromUrl !== 'dashboard' && slugFromUrl !== 'superadmin') {
      fetchDataBySlug(slugFromUrl);
    } else {
      // Fallback para um tenant_id padrão se não houver slug
      fetchData(1); 
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  async function fetchDataBySlug(slug) {
    try {
      setLoading(true);
      setError(null);
      
      const settingsResponse = await fetch(`/api/public/settings?slug=${slug}`, { cache: 'no-store' });
      
      if (!settingsResponse.ok) {
        throw new Error(`Erro ${settingsResponse.status}: ${settingsResponse.statusText}`);
      }
      
      const settingsData = await settingsResponse.json();
      
      if (settingsData.success && settingsData.data) {
        const id = settingsData.data.tenant_id || settingsData.data.id;
        setTenantId(id);
        setSettings(settingsData.data);
        
        // Carregamento paralelo eficiente do Arquivo 1
        const [galleryRes, barbersRes, servicesRes] = await Promise.all([
          fetch(`/api/public/gallery?tenant_id=${id}`, { cache: 'no-store' }),
          fetch(`/api/public/barbers?tenant_id=${id}`, { cache: 'no-store' }),
          fetch(`/api/services?tenant_id=${id}`, { cache: 'no-store' })
        ]);

        if (galleryRes.ok) {
          const galleryData = await galleryRes.json();
          setGallery(galleryData.data || []);
        }
        
        if (barbersRes.ok) {
          const barbersData = await barbersRes.json();
          setBarbers(barbersData.data || []);
        }
        
        if (servicesRes.ok) {
          const servicesData = await servicesRes.json();
          setServices(servicesData.data || []);
        }
      } else {
        setError('Barbearia não encontrada.');
      }
    } catch (error) {
      console.error('Erro ao buscar dados pelo slug:', error);
      setError('Erro ao carregar os dados da barbearia. Por favor, tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchData(id) {
    try {
      setLoading(true);
      setError(null);
      
      const settingsResponse = await fetch(`/api/public/settings?tenant_id=${id}`, { cache: 'no-store' });
      
      if (!settingsResponse.ok) {
        throw new Error(`Erro ${settingsResponse.status}: ${settingsResponse.statusText}`);
      }
      
      const settingsData = await settingsResponse.json();
      
      if (settingsData.success && settingsData.data) {
        setTenantId(id);
        setSettings(settingsData.data);
        
        const [galleryRes, barbersRes, servicesRes] = await Promise.all([
          fetch(`/api/public/gallery?tenant_id=${id}`, { cache: 'no-store' }),
          fetch(`/api/public/barbers?tenant_id=${id}`, { cache: 'no-store' }),
          fetch(`/api/services?tenant_id=${id}`, { cache: 'no-store' })
        ]);

        if (galleryRes.ok) {
          const galleryData = await galleryRes.json();
          setGallery(galleryData.data || []);
        }
        
        if (barbersRes.ok) {
          const barbersData = await barbersRes.json();
          setBarbers(barbersData.data || []);
        }
        
        if (servicesRes.ok) {
          const servicesData = await servicesRes.json();
          setServices(servicesData.data || []);
        }
      } else {
        setError('Barbearia não encontrada.');
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setError('Erro ao carregar os dados da barbearia.');
    } finally {
      setLoading(false);
    }
  }

  const handleAgendar = () => {
    const pathParts = window.location.pathname.split('/');
    const slug = pathParts[1];
    window.location.href = `/${slug}/agendamento/agendar`;
  };

  const handleConhecerMais = () => {
    const servicesSection = document.getElementById('services');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleInstagram = () => {
    const instagramUrl = settings?.instagram_url || 'https://instagram.com';
    window.open(instagramUrl, '_blank');
  };

  if (loading) {
    return <div style={styles.loading}>Carregando...</div>;
  }

  if (error || !settings) {
    return <div style={styles.loading}>{error || 'Erro ao carregar configurações'}</div>;
  }

  // Definições de cores dinâmicas do Arquivo 2
  const primaryColor = settings.primary_color || '#E50914';
  const secondaryColor = settings.secondary_color || '#000';
  const accentColor = settings.accent_color || '#fff';

  // Estilos dinâmicos e responsivos do Arquivo 2
  const dynamicStyles = {
    ...styles,
    container: { ...styles.container, backgroundColor: secondaryColor },
    header: { 
      ...styles.header, 
      backgroundColor: secondaryColor, 
      borderBottomColor: primaryColor,
      padding: isMobile ? '15px 20px' : '20px 40px',
    },
    logoText: { ...styles.logoText, color: primaryColor, fontSize: isMobile ? '20px' : '24px' },
    hero: { 
      ...styles.hero, 
      backgroundColor: secondaryColor,
      padding: isMobile ? '120px 20px 60px' : '160px 40px 100px',
      textAlign: isMobile ? 'center' : 'left',
      flexDirection: isMobile ? 'column' : 'row',
    },
    heroTitle: {
      ...styles.heroTitle,
      fontSize: isMobile ? '40px' : '64px',
    },
    heroSubtitle: {
      ...styles.heroSubtitle,
      fontSize: isMobile ? '16px' : '18px',
      margin: isMobile ? '0 auto 30px' : '0 0 40px',
    },
    heroButtons: {
      ...styles.heroButtons,
      justifyContent: isMobile ? 'center' : 'flex-start',
    },
    heroTitleRed: { ...styles.heroTitleRed, color: primaryColor },
    buttonPrimary: { ...styles.buttonPrimary, backgroundColor: primaryColor, color: accentColor },
    buttonSecondary: { ...styles.buttonSecondary, color: primaryColor, borderColor: primaryColor, backgroundColor: accentColor },
    sectionTitle: { 
      ...styles.sectionTitle, 
      color: primaryColor,
      fontSize: isMobile ? '32px' : '40px',
      marginBottom: isMobile ? '40px' : '60px',
    },
    services: { 
      ...styles.services, 
      backgroundColor: secondaryColor,
      padding: isMobile ? '60px 20px' : '100px 40px',
    },
    serviceCardHighlight: { ...styles.serviceCardHighlight, borderColor: primaryColor, backgroundColor: accentColor },
    servicePrice: { ...styles.servicePrice, color: primaryColor },
    cutsGallery: { 
      ...styles.cutsGallery, 
      backgroundColor: secondaryColor,
      padding: isMobile ? '60px 20px' : '100px 40px',
    },
    team: { 
      ...styles.team, 
      backgroundColor: secondaryColor,
      padding: isMobile ? '60px 20px' : '100px 40px',
    },
    teamRole: { ...styles.teamRole, color: primaryColor },
    finalCta: { 
      ...styles.finalCta, 
      backgroundColor: secondaryColor,
      padding: isMobile ? '60px 20px' : '100px 40px',
    },
    ctaTitle: {
      ...styles.ctaTitle,
      fontSize: isMobile ? '32px' : '48px',
    },
    ctaSubtitle: {
      ...styles.ctaSubtitle,
      fontSize: isMobile ? '16px' : '18px',
    },
    ctaTitleRed: { ...styles.ctaTitleRed, color: primaryColor },
    ctaButtonPrimary: { ...styles.ctaButtonPrimary, backgroundColor: primaryColor, color: accentColor },
    ctaButtonSecondary: { ...styles.ctaButtonSecondary, color: primaryColor, borderColor: primaryColor, backgroundColor: accentColor },
    footer: { ...styles.footer, backgroundColor: secondaryColor },
  };

  return (
    <div style={dynamicStyles.container}>
      {/* Header */}
      <header style={dynamicStyles.header}>
        <div style={styles.headerLeft}>
          {settings.logo_url ? (
            <img src={settings.logo_url} alt="Logo" style={{...styles.logoImage, height: isMobile ? '30px' : '40px'}} />
          ) : (
            <div style={dynamicStyles.logoText}>
              {settings.name || 'BarberSaaS'}
            </div>
          )}
        </div>
        <div style={styles.placeholder} />
      </header>

      {/* Hero Section */}
      <section style={dynamicStyles.hero}>
        <div style={styles.heroContent}>
          <h1 style={dynamicStyles.heroTitle}>
            CORTE  
            <span style={dynamicStyles.heroTitleRed}> PERFEITO</span>
          </h1>
          <p style={dynamicStyles.heroSubtitle}>
            {settings.description || 'A maior rede de barbearia do Brasil. Qualidade, preço justo e experiência premium em cada corte.'}
          </p>
          <div style={dynamicStyles.heroButtons}>
            <button style={dynamicStyles.buttonPrimary} onClick={handleAgendar}>
              Agendar Agora →
            </button>
            <button style={dynamicStyles.buttonSecondary} onClick={handleConhecerMais}>
              Conhecer Mais
            </button>
          </div>
        </div>
        <div style={{...styles.heroImage, marginTop: isMobile ? '40px' : '0', width: isMobile ? '100%' : '50%'}}>
          {settings.banner_url ? (
            <img src={settings.banner_url} alt="Banner" style={styles.heroImageActual} />
          ) : (
            <div style={{...styles.heroImagePlaceholder, height: isMobile ? '300px' : '400px', backgroundColor: '#111'}}></div>
          )}
        </div>
      </section>

      {/* Services Section */}
      <section id="services" style={dynamicStyles.services}>
        <h2 style={dynamicStyles.sectionTitle}>NOSSOS SERVIÇOS</h2>
        <div style={{...styles.servicesGrid, gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))'}}>
          {services.length > 0 ? (
            services.map((service, index) => (
              <div 
                key={service.id} 
                style={{ 
                  ...styles.serviceCard, 
                  padding: isMobile ? '30px 20px' : '40px',
                  ...(index === 2 ? dynamicStyles.serviceCardHighlight : {})
                }}
              >
                <div style={styles.serviceIcon}>{service.emoji || '✂️'}</div>
                <h3 style={{...styles.serviceName, color: index === 2 ? '#000' : '#fff'}}>{service.name}</h3>
                <p style={{...styles.serviceDesc, color: index === 2 ? '#333' : '#aaa'}}>{service.description}</p>
                <div style={{...dynamicStyles.servicePrice, color: index === 2 ? primaryColor : primaryColor}}>
                  R$ {parseFloat(service.price).toFixed(2)}
                </div>
              </div>
            ))
          ) : (
            <div style={styles.serviceCard}>
              <p style={styles.serviceDesc}>Nenhum serviço cadastrado no painel ADM.</p>
            </div>
          )}
        </div>
      </section>

      {/* Gallery Section */}
      {gallery.length > 0 && (
        <section id="gallery" style={dynamicStyles.cutsGallery}>
          <h2 style={dynamicStyles.sectionTitle}>NOSSOS CORTES</h2>
          <p style={styles.cutsSubtitle}>Confira os melhores trabalhos da nossa equipe</p>
          <div style={{...styles.cutsGrid, gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(250px, 1fr))'}}>
            {gallery.map((photo) => (
              <div key={photo.id} style={{...styles.cutsItem, height: isMobile ? '250px' : '300px'}}>
                <img 
                  src={photo.url || photo.image_url || photo.path} 
                  alt={photo.title || 'Corte'} 
                  style={styles.cutsImage} 
                  onError={(e) => {
                    if (photo.url && !photo.url.startsWith('http') && !photo.url.startsWith('/')) {
                      e.currentTarget.src = '/' + photo.url;
                    }
                  }}
                />
                {photo.title && <div style={styles.cutsTitle}>{photo.title}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Team Section */}
      {barbers.length > 0 && (
        <section id="team" style={dynamicStyles.team}>
          <h2 style={dynamicStyles.sectionTitle}>NOSSA EQUIPE</h2>
          <p style={{...styles.teamSubtitle, marginBottom: isMobile ? '40px' : '60px'}}>Profissionais experientes e dedicados ao seu estilo</p>
          <div style={{...styles.teamMembers, gap: isMobile ? '30px' : '40px'}}>
            {barbers.map((barber) => (
              <div key={barber.id} style={{...styles.teamMember, width: isMobile ? '100%' : '280px'}}>
                <div style={{...styles.teamPhoto, width: isMobile ? '150px' : '200px', height: isMobile ? '150px' : '200px'}}>
                  {barber.photo_url ? (
                    <img 
                      src={barber.photo_url} 
                      alt={barber.name} 
                      style={styles.teamPhotoImage} 
                    />
                  ) : (
                    <div style={styles.teamPhotoPlaceholder}>👤</div>
                  )}
                </div>
                <h3 style={styles.teamName}>{barber.name}</h3>
                <p style={dynamicStyles.teamRole}>{barber.specialty || 'Barbeiro'}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contact/CTA Section */}
      <section id="contact" style={dynamicStyles.finalCta}>
        <h2 style={dynamicStyles.ctaTitle}>
          AGENDE SEU 
          <span style={dynamicStyles.ctaTitleRed}> HORÁRIO</span>
        </h2>
        <p style={dynamicStyles.ctaSubtitle}>
          {settings.address}, {settings.city} - {settings.state}, {settings.zip_code}
          <br />
          {settings.phone} | {settings.email}
          <br />
          Horário de Funcionamento: {settings.opening_time} - {settings.closing_time}
        </p>
        <div style={dynamicStyles.heroButtons}>
          <button style={dynamicStyles.ctaButtonPrimary} onClick={handleAgendar}>
            Agendar Agora →
          </button>
          {settings.instagram_url && (
            <button style={dynamicStyles.ctaButtonSecondary} onClick={handleInstagram}>
              Instagram
            </button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={dynamicStyles.footer}>
        <p>&copy; {new Date().getFullYear()} {settings.name || 'BarberSaaS'}. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

const styles = {
  container: { fontFamily: 'Inter, sans-serif', minHeight: '100vh', color: '#fff' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' },
  headerLeft: { display: 'flex', alignItems: 'center' },
  logoImage: { height: '40px' },
  logoText: { fontSize: '24px', fontWeight: 'bold' },
  placeholder: { flexGrow: 1 },
  hero: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  heroContent: { maxWidth: '600px' },
  heroTitle: { fontWeight: 'bold', lineHeight: '1.1', marginBottom: '20px' },
  heroTitleRed: {},
  heroSubtitle: { color: '#aaa', marginBottom: '40px' },
  heroButtons: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
  buttonPrimary: { padding: '15px 30px', borderRadius: '5px', fontWeight: 'bold', border: 'none', cursor: 'pointer', transition: 'all 0.3s' },
  buttonSecondary: { padding: '15px 30px', borderRadius: '5px', fontWeight: 'bold', border: '1px solid', cursor: 'pointer', transition: 'all 0.3s' },
  sectionTitle: { fontWeight: 'bold', textAlign: 'center' },
  services: {},
  servicesGrid: { display: 'grid', gap: '30px' },
  serviceCard: { backgroundColor: '#000', borderRadius: '10px', textAlign: 'center', border: '1px solid #333', transition: 'transform 0.3s ease' },
  serviceCardHighlight: { border: 'none' },
  serviceIcon: { fontSize: '48px', marginBottom: '20px' },
  serviceName: { fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' },
  serviceDesc: { fontSize: '16px', marginBottom: '20px' },
  servicePrice: { fontSize: '22px', fontWeight: 'bold' },
  cutsGallery: { textAlign: 'center' },
  cutsSubtitle: { color: '#aaa', marginBottom: '40px' },
  cutsGrid: { display: 'grid', gap: '20px' },
  cutsItem: { position: 'relative', borderRadius: '10px', overflow: 'hidden' },
  cutsImage: { width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' },
  cutsTitle: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', color: '#fff', fontWeight: 'bold' },
  team: { textAlign: 'center' },
  teamSubtitle: { color: '#aaa' },
  teamMembers: { display: 'flex', justifyContent: 'center', flexWrap: 'wrap' },
  teamMember: { textAlign: 'center' },
  teamPhoto: { borderRadius: '50%', overflow: 'hidden', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #222' },
  teamPhotoImage: { width: '100%', height: '100%', objectFit: 'cover' },
  teamPhotoPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' },
  teamName: { fontSize: '22px', fontWeight: 'bold', marginBottom: '5px' },
  teamRole: { fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' },
  finalCta: { textAlign: 'center' },
  ctaTitle: { fontWeight: 'bold', marginBottom: '20px' },
  ctaTitleRed: {},
  ctaSubtitle: { color: '#aaa', maxWidth: '800px', margin: '0 auto 40px', lineHeight: '1.6' },
  ctaButtonPrimary: { padding: '15px 30px', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', border: 'none', cursor: 'pointer', transition: 'all 0.3s' },
  ctaButtonSecondary: { padding: '15px 30px', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', border: '2px solid', cursor: 'pointer', transition: 'all 0.3s' },
  footer: { padding: '40px', textAlign: 'center', borderTop: '1px solid #222', color: '#aaa', fontSize: '14px' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontSize: '24px', color: '#E50914' },
  heroImage: { flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' },
  heroImageActual: { maxWidth: '100%', height: '400px', objectFit: 'cover', borderRadius: '10px' },
  heroImagePlaceholder: { width: '100%', height: '400px', backgroundColor: '#111', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#aaa' },
};