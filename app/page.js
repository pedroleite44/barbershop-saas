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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    const subdomain = window.location.hostname.split('.')[0];
    const subdomainMap = {
      'localhost': 1,
      'barbershop': 1,
      'blackzone': 1,
      'premiumcuts': 2,
    };
    const id = subdomainMap[subdomain] || 1;
    setTenantId(id);
    
    fetchData(id);

    return () => window.removeEventListener('resize', handleResize);
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

      const servicesResponse = await fetch(`/api/services?tenant_id=${id}`);
      const servicesData = await servicesResponse.json();
      setServices(servicesData.data || []);

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
    const instagramUrl = settings?.instagram_url || 'https://instagram.com';
    window.open(instagramUrl, '_blank');
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
        <div style={{...styles.heroImage, marginTop: isMobile ? '40px' : '0'}}>
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

      {/* Nossos Cortes Section */}
      {gallery.length > 0 && (
        <section style={dynamicStyles.cutsGallery}>
          <h2 style={dynamicStyles.sectionTitle}>NOSSOS CORTES</h2>
          <p style={styles.cutsSubtitle}>Confira os melhores trabalhos da nossa equipe</p>
          <div style={{...styles.cutsGrid, gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(250px, 1fr))'}}>
            {gallery.map((photo) => (
              <div key={photo.id} style={{...styles.cutsItem, height: isMobile ? '250px' : '300px'}}>
                <img src={photo.image_url} alt={photo.title || 'Corte'} style={styles.cutsImage} />
                {photo.title && <div style={styles.cutsTitle}>{photo.title}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Team Section */}
      {barbers.length > 0 && (
        <section style={dynamicStyles.team}>
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
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div style={{
                    ...styles.teamPhotoPlaceholder,
                    display: barber.photo_url ? 'none' : 'flex',
                    backgroundColor: '#1a1a1a'
                  }}></div>
                </div>
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
        <h2 style={dynamicStyles.ctaTitle}>
          PRONTO PARA SEU  
          <span style={dynamicStyles.ctaTitleRed}> MELHOR CORTE?</span>
        </h2>
        <p style={dynamicStyles.ctaSubtitle}>
          Agende agora mesmo e experimente a qualidade premium. Estamos abertos de segunda a sábado, das {settings.opening_time || '9h'} às {settings.closing_time || '21h'}
        </p>
        <div style={{...styles.ctaButtons, gap: isMobile ? '15px' : '20px', marginBottom: isMobile ? '40px' : '60px'}}>
          <button style={{...dynamicStyles.ctaButtonPrimary, width: isMobile ? '100%' : 'auto', padding: isMobile ? '15px 20px' : '18px 40px'}} onClick={handleAgendar}>
            Agendar Agora →
          </button>
          <button style={{...dynamicStyles.ctaButtonSecondary, width: isMobile ? '100%' : 'auto', padding: isMobile ? '15px 20px' : '18px 40px'}} onClick={handleInstagram}>
            Seguir no Instagram
          </button>
        </div>

        {/* Contact Info */}
        <div style={{...styles.contactInfo, gap: isMobile ? '30px' : '60px', flexDirection: isMobile ? 'column' : 'row'}}>
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
              {settings.opening_time} - {settings.closing_time}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={dynamicStyles.footer}>
        <p>© {new Date().getFullYear()} {settings.name}. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

const styles = {
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#000',
    color: '#fff',
    fontSize: '24px',
  },
  container: {
    color: '#fff',
    fontFamily: 'Arial, sans-serif',
    overflowX: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderBottom: '1px solid #E50914',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    letterSpacing: '2px',
  },
  logoText: {
    fontWeight: 'bold',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: '#E50914',
    transition: 'all 0.3s ease',
  },
  logoImage: {
    width: 'auto',
    objectFit: 'contain',
  },
  placeholder: {
    width: '40px',
  },
  hero: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '40px',
    flexWrap: 'wrap',
  },
  heroContent: {
    flex: 1,
    minWidth: '300px',
  },
  heroTitle: {
    fontWeight: 'bold',
    marginBottom: '20px',
    lineHeight: '1.1',
  },
  heroTitleRed: {
    color: '#E50914',
  },
  heroSubtitle: {
    color: '#aaa',
    maxWidth: '500px',
    lineHeight: '1.6',
  },
  heroButtons: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  },
  buttonPrimary: {
    padding: '15px 30px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  buttonSecondary: {
    padding: '15px 30px',
    borderRadius: '8px',
    border: '2px solid #E50914',
    backgroundColor: 'transparent',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  heroImage: {
    flex: 1,
    minWidth: '300px',
    display: 'flex',
    justifyContent: 'center',
  },
  heroImageActual: {
    width: '100%',
    maxWidth: '500px',
    borderRadius: '20px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
  },
  heroImagePlaceholder: {
    width: '100%',
    maxWidth: '500px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  services: {
    textAlign: 'center',
  },
  sectionTitle: {
    fontWeight: 'bold',
    letterSpacing: '2px',
  },
  servicesGrid: {
    display: 'grid',
    gap: '30px',
  },
  serviceCard: {
    backgroundColor: '#111',
    borderRadius: '15px',
    border: '1px solid #222',
    transition: 'all 0.3s',
  },
  serviceCardHighlight: {
    border: '2px solid #E50914',
    transform: 'scale(1.05)',
  },
  serviceIcon: {
    fontSize: '40px',
    marginBottom: '20px',
  },
  serviceName: {
    fontSize: '22px',
    fontWeight: 'bold',
    marginBottom: '15px',
  },
  serviceDesc: {
    fontSize: '14px',
    color: '#aaa',
    marginBottom: '20px',
    lineHeight: '1.5',
  },
  servicePrice: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#E50914',
  },
  cutsGallery: {
    textAlign: 'center',
    backgroundColor: '#050505',
  },
  cutsSubtitle: {
    color: '#aaa',
    marginBottom: '40px',
  },
  cutsGrid: {
    display: 'grid',
    gap: '20px',
  },
  cutsItem: {
    position: 'relative',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  cutsImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.5s',
  },
  cutsTitle: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '20px',
    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
    color: '#fff',
    fontWeight: 'bold',
  },
  team: {
    textAlign: 'center',
  },
  teamSubtitle: {
    color: '#aaa',
  },
  teamMembers: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  teamMember: {
    textAlign: 'center',
  },
  teamPhoto: {
    borderRadius: '50%',
    overflow: 'hidden',
    margin: '0 auto 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #222',
  },
  teamPhotoImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  teamPhotoPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamName: {
    fontSize: '22px',
    fontWeight: 'bold',
    marginBottom: '5px',
  },
  teamRole: {
    fontSize: '14px',
    color: '#E50914',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  teamSpecialty: {
    fontSize: '14px',
    color: '#aaa',
    lineHeight: '1.5',
  },
  finalCta: {
    textAlign: 'center',
    borderTop: '1px solid #222',
  },
  ctaTitle: {
    fontWeight: 'bold',
    marginBottom: '20px',
  },
  ctaTitleRed: {
    color: '#E50914',
  },
  ctaSubtitle: {
    color: '#aaa',
    maxWidth: '800px',
    margin: '0 auto 40px',
    lineHeight: '1.6',
  },
  ctaButtons: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  ctaButtonPrimary: {
    backgroundColor: '#E50914',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  ctaButtonSecondary: {
    backgroundColor: 'transparent',
    color: '#E50914',
    border: '2px solid #E50914',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  contactInfo: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  contactCard: {
    textAlign: 'center',
  },
  contactIcon: {
    fontSize: '32px',
    marginBottom: '10px',
  },
  contactLabel: {
    fontSize: '14px',
    color: '#aaa',
    marginBottom: '5px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  contactValue: {
    fontSize: '16px',
    fontWeight: 'bold',
  },
  footer: {
    padding: '40px',
    textAlign: 'center',
    borderTop: '1px solid #222',
    color: '#555',
    fontSize: '14px',
  },
};