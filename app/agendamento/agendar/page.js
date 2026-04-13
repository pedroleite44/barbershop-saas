'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function BarbershopPage() {
  const params = useParams();
  const slug = params.slug;
  
  const [settings, setSettings] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    if (slug) {
      fetchData(slug);
    }

    return () => window.removeEventListener('resize', handleResize);
  }, [slug]);

  async function fetchData(slugParam) {
    try {
      // Buscar dados usando o SLUG
      const settingsResponse = await fetch(`/api/public/settings?slug=${slugParam}`);
      const settingsData = await settingsResponse.json();
      
      if (!settingsData.success) {
        console.error('Barbearia não encontrada');
        setLoading(false);
        return;
      }
      
      const tenantId = settingsData.data.id;
      setSettings(settingsData.data);

      // Buscar galeria
      const galleryResponse = await fetch(`/api/public/gallery?tenant_id=${tenantId}`);
      const galleryData = await galleryResponse.json();
      setGallery(galleryData.data || []);

      // Buscar barbeiros
      const barbersResponse = await fetch(`/api/public/barbers?tenant_id=${tenantId}`);
      const barbersData = await barbersResponse.json();
      setBarbers(barbersData.data || []);

      // Buscar serviços
      const servicesResponse = await fetch(`/api/services?tenant_id=${tenantId}`);
      const servicesData = await servicesResponse.json();
      setServices(servicesData.data || []);

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleAgendar = () => {
    if (slug) {
      window.location.href = `/${slug}/agendamento/agendar`;
    }
  };

  const handleConhecerMais = () => {
    const servicesSection = document.getElementById('services');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleInstagram = () => {
    const instagramUrl = settings?.instagram_url || 'https://instagram.com';
    window.open(instagramUrl, '_blank' );
  };

  if (loading) {
    return <div style={styles.loading}>Carregando...</div>;
  }

  if (!settings) {
    return <div style={styles.loading}>Barbearia não encontrada</div>;
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
      </header>

      <section style={dynamicStyles.hero}>
        <div style={styles.heroContent}>
          <h1 style={dynamicStyles.heroTitle}>
            CORTE  
            <span style={dynamicStyles.heroTitleRed}> PERFEITO</span>
          </h1>
          <p style={dynamicStyles.heroSubtitle}>
            {settings.description || 'Qualidade, preço justo e experiência premium em cada corte.'}
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
              <p style={styles.serviceDesc}>Nenhum serviço cadastrado.</p>
            </div>
          )}
        </div>
      </section>

      {gallery.length > 0 && (
        <section style={dynamicStyles.cutsGallery}>
          <h2 style={dynamicStyles.sectionTitle}>NOSSOS CORTES</h2>
          <div style={{...styles.cutsGrid, gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(250px, 1fr))'}}>
            {gallery.map((photo) => (
              <div key={photo.id} style={{...styles.cutsItem, height: isMobile ? '250px' : '300px'}}>
                <img src={photo.image_url} alt="Corte" style={styles.cutsImage} />
              </div>
            ))}
          </div>
        </section>
      )}

      {barbers.length > 0 && (
        <section style={dynamicStyles.team}>
          <h2 style={dynamicStyles.sectionTitle}>NOSSA EQUIPE</h2>
          <div style={{...styles.teamMembers, gap: isMobile ? '30px' : '40px'}}>
            {barbers.map((barber) => (
              <div key={barber.id} style={{...styles.teamMember, width: isMobile ? '100%' : '280px'}}>
                <div style={{...styles.teamPhoto, width: isMobile ? '150px' : '200px', height: isMobile ? '150px' : '200px'}}>
                  {barber.photo_url ? (
                    <img src={barber.photo_url} alt={barber.name} style={styles.teamPhotoImage} />
                  ) : (
                    <div style={{...styles.teamPhotoPlaceholder, width: '100%', height: '100%'}}></div>
                  )}
                </div>
                <h3 style={styles.teamName}>{barber.name}</h3>
                <p style={dynamicStyles.teamRole}>{barber.specialty || 'Barbeiro'}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={dynamicStyles.finalCta}>
        <h2 style={dynamicStyles.ctaTitle}>
          PRONTO PARA SEU
            

          <span style={dynamicStyles.ctaTitleRed}>MELHOR CORTE?</span>
        </h2>
        <div style={styles.ctaButtons}>
          <button style={dynamicStyles.ctaButtonPrimary} onClick={handleAgendar}>
            Agendar Agora
          </button>
          <button style={dynamicStyles.ctaButtonSecondary} onClick={handleInstagram}>
            Instagram
          </button>
        </div>
      </section>

      <footer style={dynamicStyles.footer}>
        <p style={styles.footerText}>© 2026 {settings.name}.</p>
      </footer>
    </div>
  );
}

const styles = {
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#000', color: '#fff', fontSize: '18px' },
  container: { width: '100%', margin: 0, padding: 0, backgroundColor: '#000', color: '#fff', fontFamily: 'Arial, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#000', borderBottom: '2px solid #E50914', padding: '20px 40px', position: 'sticky', top: 0, zIndex: 100 },
  headerLeft: { display: 'flex', alignItems: 'center' },
  logoImage: { height: '40px', objectFit: 'contain' },
  logoText: { fontSize: '24px', fontWeight: 'bold', color: '#E50914' },
  hero: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#000', padding: '160px 40px 100px', gap: '60px' },
  heroContent: { flex: 1 },
  heroTitle: { fontSize: '64px', fontWeight: 'bold', margin: '0 0 30px 0', lineHeight: '1.2', color: '#fff' },
  heroTitleRed: { color: '#E50914' },
  heroSubtitle: { fontSize: '18px', color: '#aaa', margin: '0 0 40px 0', lineHeight: '1.6' },
  heroButtons: { display: 'flex', gap: '20px', justifyContent: 'flex-start' },
  buttonPrimary: { backgroundColor: '#E50914', color: '#fff', border: 'none', padding: '15px 40px', fontSize: '16px', fontWeight: 'bold', borderRadius: '5px', cursor: 'pointer', transition: '0.3s' },
  buttonSecondary: { backgroundColor: '#fff', color: '#E50914', border: '2px solid #E50914', padding: '15px 40px', fontSize: '16px', fontWeight: 'bold', borderRadius: '5px', cursor: 'pointer', transition: '0.3s' },
  heroImage: { flex: 1 },
  heroImageActual: { width: '100%', height: 'auto', borderRadius: '10px', objectFit: 'cover' },
  heroImagePlaceholder: { width: '100%', height: '400px', backgroundColor: '#111', borderRadius: '10px' },
  services: { backgroundColor: '#000', padding: '100px 40px', textAlign: 'center' },
  sectionTitle: { fontSize: '40px', fontWeight: 'bold', color: '#E50914', marginBottom: '60px', textAlign: 'center' },
  servicesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px' },
  serviceCard: { backgroundColor: '#111', padding: '40px', borderRadius: '10px', border: '1px solid #222', textAlign: 'center', transition: '0.3s' },
  serviceCardHighlight: { borderColor: '#E50914', backgroundColor: '#fff' },
  serviceIcon: { fontSize: '48px', marginBottom: '20px' },
  serviceName: { fontSize: '20px', fontWeight: 'bold', color: '#fff', margin: '0 0 15px 0' },
  serviceDesc: { fontSize: '14px', color: '#aaa', margin: '0 0 20px 0', lineHeight: '1.6' },
  servicePrice: { fontSize: '24px', fontWeight: 'bold', color: '#E50914' },
  cutsGallery: { backgroundColor: '#000', padding: '100px 40px', textAlign: 'center' },
  cutsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '30px' },
  cutsItem: { position: 'relative', overflow: 'hidden', borderRadius: '10px', height: '300px' },
  cutsImage: { width: '100%', height: '100%', objectFit: 'cover', transition: '0.3s' },
  team: { backgroundColor: '#000', padding: '100px 40px', textAlign: 'center' },
  teamMembers: { display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '40px' },
  teamMember: { textAlign: 'center', width: '280px' },
  teamPhoto: { width: '200px', height: '200px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 20px', backgroundColor: '#111' },
  teamPhotoImage: { width: '100%', height: '100%', objectFit: 'cover' },
  teamPhotoPlaceholder: { backgroundColor: '#222' },
  teamName: { fontSize: '20px', fontWeight: 'bold', color: '#fff', margin: '0 0 10px 0' },
  teamRole: { fontSize: '14px', color: '#E50914' },
  finalCta: { backgroundColor: '#000', padding: '100px 40px', textAlign: 'center' },
  ctaTitle: { fontSize: '48px', fontWeight: 'bold', color: '#fff', marginBottom: '20px', lineHeight: '1.2' },
  ctaTitleRed: { color: '#E50914' },
  ctaSubtitle: { fontSize: '18px', color: '#aaa', marginBottom: '40px' },
  ctaButtons: { display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' },
  ctaButtonPrimary: { backgroundColor: '#E50914', color: '#fff', border: 'none', padding: '15px 40px', fontSize: '16px', fontWeight: 'bold', borderRadius: '5px', cursor: 'pointer', transition: '0.3s' },
  ctaButtonSecondary: { backgroundColor: '#fff', color: '#E50914', border: '2px solid #E50914', padding: '15px 40px', fontSize: '16px', fontWeight: 'bold', borderRadius: '5px', cursor: 'pointer', transition: '0.3s' },
  footer: { backgroundColor: '#000', padding: '40px', textAlign: 'center', borderTop: '1px solid #222' },
  footerText: { fontSize: '14px', color: '#666', margin: 0 },
};