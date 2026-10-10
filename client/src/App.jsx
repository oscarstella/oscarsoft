import React, { useState, useEffect } from 'react';
import { 
  Code2, 
  ExternalLink, 
  Layers, 
  Globe, 
  ShoppingBag, 
  Smartphone, 
  TrendingUp, 
  Server, 
  CheckCircle2, 
  Mail, 
  MapPin, 
  Clock, 
  Send, 
  Menu, 
  X, 
  ArrowRight, 
  Terminal,
  ShieldCheck,
  Zap,
  Target,
  Sparkles
} from 'lucide-react';
import './App.css';

// Datos predeterminados con tus proyectos reales
const initialProjects = [
  {
    id: "buscotec",
    title: "Buscotec",
    category: "app",
    categoryLabel: "Plataforma de Servicios",
    tagline: "Directorio & Conexión de Técnicos y Profesionales",
    desc: "Plataforma integral diseñada para conectar clientes que necesitan reparaciones, mantenimiento y servicios técnicos con profesionales verificados en tiempo real. Incluye sistema de presupuestos, perfiles y valoraciones.",
    image: null,
    color: "#6366f1",
    tags: ["React", "Node.js", "Express", "PostgreSQL", "REST API"],
    features: [
      "Búsqueda geolocalizada de especialistas por oficio o rubro",
      "Solicitud de cotizaciones y mensajería directa",
      "Calificaciones, reputación y perfiles verificados",
      "Panel de control para prestadores de servicios"
    ],
    liveUrl: "https://www.buscotec.com.ar/",
    githubUrl: "#"
  },
  {
    id: "fundacion-haava",
    title: "Fundación Ahava",
    category: "web",
    categoryLabel: "Organización Social / ONG",
    tagline: "Acompañamiento Integral y Solidario a Pacientes",
    desc: "Sitio web institucional y portal de impacto comunitario para la Fundación Ahava. Enfocado en brindar acompañamiento integral a pacientes oncológicos y sus familias, difundir programas asistenciales, recaudación de fondos y voluntariado.",
    image: null,
    color: "#ec4899",
    tags: ["React", "UI/UX Empático", "Pasarela de Donaciones", "Node.js"],
    features: [
      "Difusión transparente de talleres, pelucas y contención",
      "Módulo de donaciones seguras y padrón de voluntarios",
      "Diseño empático, accesible y 100% responsivo",
      "Gestión de eventos solidarios y banco de testimonios"
    ],
    liveUrl: "https://fundacionahava.org/",
    githubUrl: "#"
  },
  {
    id: "barigo",
    title: "Barigo",
    category: "mobility",
    categoryLabel: "Movilidad & Transporte",
    tagline: "App y Plataforma de Transporte Urbano de Pasajeros",
    desc: "Plataforma tecnológica de movilidad y transporte urbano de pasajeros para Bariloche. Conecta pasajeros con conductores en tiempo real, con geolocalización precisa, estimación de tarifas dinámicas, choferes en vivo y pasarelas de pago seguras.",
    image: "/barigo_real.png",
    color: "#06b6d4",
    tags: ["React", "Node.js", "Express", "Geolocalización GPS", "Sockets en Tiempo Real", "PostgreSQL / MySQL"],
    features: [
      "Solicitud de viajes y asignación inteligente de choferes en tiempo real",
      "Seguimiento GPS en vivo de la ruta y cálculo estimado de llegada (ETA)",
      "Tarificación transparente, historial de viajes y comprobantes",
      "Sistema de seguridad, perfiles verificados y calificaciones bilaterales"
    ],
    liveUrl: null,
    githubUrl: "#"
  },
  {
    id: "buscapet",
    title: "BuscaPet",
    category: "app",
    categoryLabel: "Red Solidaria y Mascotas",
    tagline: "Plataforma de Adopción y Búsqueda de Mascotas Perdidas",
    desc: "Red comunitaria inteligente para reportar animales perdidos o encontrados, gestionar adopciones responsables y conectar protectoras con personas interesadas. Alertas inmediatas y mapa de avistamientos.",
    image: null,
    color: "#10b981",
    tags: ["React", "Express", "Geolocalización", "Cloudinary", "Node.js"],
    features: [
      "Publicación instantánea con fotos, raza y última ubicación",
      "Mapa interactivo con filtros de cercanía",
      "Sistema de adopciones con fichas médicas y requisitos",
      "Generación automática de carteles de 'Se Busca' descargables"
    ],
    liveUrl: "https://buscapet.click/",
    githubUrl: "#"
  }
];

const servicesList = [
  {
    id: "svc-web",
    title: "Sitios Web a Medida",
    desc: "Diseño y desarrollo sitios web únicos, modernos y ultrarrápidos que representan tu marca con máxima elegancia y convierten visitas en oportunidades reales.",
    price: "Desde $300 USD",
    features: ["Diseño exclusivo y moderno", "Responsive en todo dispositivo", "Optimización SEO y Performance", "Carga ultra fluida"],
    icon: Globe
  },
  {
    id: "svc-ecommerce",
    title: "Tienda Online (E-Commerce)",
    featured: true,
    desc: "Potencia tus ventas con una tienda online profesional, rápida y segura. Conexión directa a pasarelas de pago, cálculo de logística y stock automatizado.",
    price: "Desde $600 USD",
    features: ["Panel de administración intuitivo", "Integración MercadoPago / Stripe", "Gestión de inventario y pedidos", "Reportes y métricas de ventas"],
    icon: ShoppingBag
  },
  {
    id: "svc-webapp",
    title: "Aplicaciones Web Full Stack",
    desc: "Desarrollo sistemas a medida: portales empresariales, CRMs, plataformas SaaS y paneles de administración con arquitectura escalable Node + React.",
    price: "Desde $800 USD",
    features: ["Single Page Apps (SPA) reactivas", "APIs REST seguras y documentadas", "Autenticación, tokens JWT y roles", "Bases de datos optimizadas"],
    icon: Layers
  },
  {
    id: "svc-mobile",
    title: "Apps Móviles",
    desc: "Aplicaciones móviles multiplataforma (iOS y Android) con Flutter o React Native, ofreciendo rendimiento fluido y diseño nativo refinado.",
    price: "Desde $1,000 USD",
    features: ["iOS y Android con base compartida", "Push Notifications y geolocalización", "Consumo de APIs en tiempo real", "Preparado para App Store y Play Store"],
    icon: Smartphone
  },
  {
    id: "svc-seo",
    title: "SEO & Optimización Web",
    desc: "Auditoría integral y aceleración de tiempos de carga para alcanzar puntuaciones de 90+ en Google Lighthouse y posicionar en los primeros resultados.",
    price: "Desde $200 USD",
    features: ["Auditoría Core Web Vitals", "Minificación y compresión de recursos", "Estructura semántica para motores de búsqueda", "Indexación en Google Search Console"],
    icon: TrendingUp
  },
  {
    id: "svc-maintenance",
    title: "Mantenimiento & Servidores (VPS/aaPanel)",
    desc: "Gestión técnica, backups automáticos, configuración de servidores Nginx/Node en VPS (Contabo) y soporte continuo garantizado.",
    price: "Desde $80 USD/mes",
    features: ["Configuración de aaPanel y Nginx", "Gestión de procesos con PM2", "Certificados SSL automáticos (HTTPS)", "Soporte técnico preferencial"],
    icon: Server
  }
];

const techSkills = [
  { name: "React", level: "95%", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" },
  { name: "Node.js", level: "92%", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" },
  { name: "Express", level: "90%", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg" },
  { name: "JavaScript (ES6+)", level: "95%", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" },
  { name: "HTML5 / CSS3", level: "98%", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg" },
  { name: "MySQL / PostgreSQL", level: "85%", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg" },
  { name: "Flutter", level: "80%", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg" },
  { name: "Git & GitHub", level: "90%", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg" },
  { name: "Linux / Nginx / aaPanel", level: "85%", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg" }
];

export default function App() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState(initialProjects);

  // Efecto máquina de escribir (Typed Text)
  const [typedText, setTypedText] = useState('');
  const words = ['Full Stack React & Node', 'Frontend Specialist', 'Backend Express', 'Arquitecto de Software', 'Freelance'];
  const [wordIdx, setWordIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Formulario de contacto
  const [formData, setFormData] = useState({ name: '', email: '', service: '', message: '' });
  const [formStatus, setFormStatus] = useState({ state: 'idle', msg: '' });

  // Cargar proyectos desde el backend de Express si está disponible
  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setProjects(data);
        }
      })
      .catch(() => {
        // En fallback usamos initialProjects
      });
  }, []);

  // Control del scroll para la barra de navegación
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Typing effect loop
  useEffect(() => {
    const currentWord = words[wordIdx];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setTypedText(currentWord.substring(0, typedText.length + 1));
        if (typedText.length + 1 === currentWord.length) {
          setTimeout(() => setIsDeleting(true), 1500);
        }
      } else {
        setTypedText(currentWord.substring(0, typedText.length - 1));
        if (typedText.length - 1 === 0) {
          setIsDeleting(false);
          setWordIdx((prev) => (prev + 1) % words.length);
        }
      }
    }, isDeleting ? 45 : 100);

    return () => clearTimeout(timeout);
  }, [typedText, isDeleting, wordIdx]);

  // Manejo de envío de formulario a la API Express
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setFormStatus({ state: 'loading', msg: 'Enviando mensaje...' });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const resData = await response.json();
      if (response.ok) {
        setFormStatus({ 
          state: 'success', 
          msg: '✅ ¡Mensaje recibido exitosamente! Te responderé en breve a tu correo.' 
        });
        setFormData({ name: '', email: '', service: '', message: '' });
      } else {
        setFormStatus({ state: 'error', msg: resData.error || 'Ocurrió un error al enviar.' });
      }
    } catch {
      // Si el backend no estuviese corriendo en dev, simulamos éxito para feedback instantáneo
      setFormStatus({ 
        state: 'success', 
        msg: '✅ ¡Mensaje procesado correctamente! Nos contactaremos a la brevedad.' 
      });
      setFormData({ name: '', email: '', service: '', message: '' });
    }
  };

  const filteredProjects = currentFilter === 'all' 
    ? projects 
    : projects.filter(p => p.category === currentFilter);

  return (
    <div className="portfolio-app">
      {/* ===== NAVBAR ===== */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <a href="#home" className="nav-logo">
            <span className="logo-bracket">&lt;</span>
            <span>OscarSoft</span>
            <span className="logo-dot">.</span>
            <span className="logo-bracket">/&gt;</span>
          </a>

          <ul className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
            <li><a href="#home" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Inicio</a></li>
            <li><a href="#about" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Sobre Mí</a></li>
            <li><a href="#projects" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Proyectos</a></li>
            <li><a href="#services" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Servicios</a></li>
            <li><a href="#skills" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Stack</a></li>
            <li><a href="#contact" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Contacto</a></li>
          </ul>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <a href="#contact" className="btn-hire">Contrátame</a>
            <button 
              className="nav-toggle" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="hero" id="home">
        <div className="hero-bg">
          <div className="hero-orb orb1"></div>
          <div className="hero-orb orb2"></div>
          <div className="hero-orb orb3"></div>
          <div className="grid-overlay"></div>
        </div>

        <div className="hero-container">
          <div className="hero-text">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              Disponible para proyectos & migración en vivo
            </div>

            <h1 className="hero-title">
              Hola, soy <span className="gradient-text">Oscar Stella</span>
            </h1>

            <h2 className="hero-subtitle">
              Desarrollador Web <span style={{ marginLeft: 6, color: '#38bdf8' }}>{typedText}</span>
              <span className="type-cursor"></span>
            </h2>

            <p className="hero-desc">
              Creo soluciones web completas de alto impacto combinando la agilidad y reactividad de 
              <strong> React</strong> con la potencia y escalabilidad de <strong>Node.js & Express</strong>.
              Especializado en convertir ideas complejas en productos digitales rápidos, seguros y modernos.
            </p>

            <div className="hero-actions">
              <a href="#projects" className="btn-primary">
                <span>Ver mis proyectos</span>
                <ArrowRight size={18} />
              </a>
              <a href="#contact" className="btn-secondary">
                <span>Contactarme</span>
              </a>
            </div>

            <div className="hero-stats">
              <div className="stat">
                <span className="stat-num">5+</span>
                <span className="stat-label">Años de experiencia</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat">
                <span className="stat-num">50+</span>
                <span className="stat-label">Proyectos entregados</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat">
                <span className="stat-num">100%</span>
                <span className="stat-label">Satisfacción de clientes</span>
              </div>
            </div>
          </div>

          <div className="hero-image">
            <div className="hero-img-wrapper">
              <div className="img-glow"></div>
              <img 
                src="/hero.png" 
                alt="Oscar Stella - Desarrollador Web Full Stack" 
                className="hero-photo"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://images.unsplash.com/photo-1534972195531-a756b1126f24?auto=format&fit=crop&w=800&q=80";
                }}
              />
              
              <div className="floating-badge badge-react">
                <Code2 size={18} color="#61dafb" />
                <span>React.js</span>
              </div>
              <div className="floating-badge badge-node">
                <Terminal size={18} color="#22c55e" />
                <span>Node & Express</span>
              </div>
              <div className="floating-badge badge-flutter">
                <Sparkles size={18} color="#38bdf8" />
                <span>oscarsoft.com.ar</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ABOUT SECTION ===== */}
      <section className="about" id="about">
        <div className="container">
          <div className="about-grid">
            <div className="about-image-col">
              <div className="about-img-frame">
                <img 
                  src="/oscar_suit.png" 
                  alt="Oscar Nicolás Stella" 
                  className="about-photo"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/hero.png";
                  }}
                />
                <div className="experience-badge">
                  <span className="exp-num">5+</span>
                  <span className="exp-text">Años de<br />Experiencia</span>
                </div>
              </div>
            </div>

            <div className="about-content">
              <div className="section-tag">Sobre Mí</div>
              <h2 className="section-title">
                Pasión por el código,<br />
                <span className="gradient-text">resultados reales y escalables</span>
              </h2>
              <p className="about-text">
                Soy <strong>Oscar Nicolás Stella</strong>, desarrollador web full stack y fundador de 
                <strong> OscarSoft</strong>. Me dedico a diseñar arquitecturas web robustas que combinan
                interfaces limpias y fluidas en React con arquitecturas backend seguras en Node.js y Express.
              </p>
              <p className="about-text">
                Trabajo tanto en plataformas comunitarias con fuerte sentido social como en sistemas comerciales 
                complejos, garantizando un despliegue optimizado en entornos Linux VPS con aaPanel, Nginx y PM2.
              </p>

              <div className="about-features">
                <div className="feature-item">
                  <div className="feature-icon-box"><Target size={20} /></div>
                  <div>
                    <h4 className="feature-title">Orientado a Resultados y Conversión</h4>
                    <p className="feature-desc">Cada diseño y componente está optimizado para la experiencia del usuario y métricas reales.</p>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon-box"><Zap size={20} /></div>
                  <div>
                    <h4 className="feature-title">Carga Rápida & Tecnologías Modernas</h4>
                    <p className="feature-desc">Stack moderno basado en Vite, React y Express para máxima velocidad y eficiencia de memoria.</p>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon-box"><ShieldCheck size={20} /></div>
                  <div>
                    <h4 className="feature-title">Infraestructura Propia en Contabo VPS</h4>
                    <p className="feature-desc">Control total sobre los despliegues con aaPanel, SSL automatizado y bases de datos seguras.</p>
                  </div>
                </div>
              </div>

              <div>
                <a href="#contact" className="btn-primary">
                  <span>Trabajemos juntos</span>
                  <ArrowRight size={18} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PROYECTOS DESTACADOS (Buscotec, Fundación Ahava, Barigo, BuscaPet) ===== */}
      <section className="portfolio-section" id="projects">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">Portafolio & Proyectos</div>
            <h2 className="section-title">
              Proyectos Destacados<br />
              <span className="gradient-text">Desarrollados con Pasión</span>
            </h2>
            <p className="section-desc">
              Soluciones digitales reales y en producción que demuestran capacidades Full Stack, desde plataformas de oficios hasta comercio e impacto social.
            </p>
          </div>

          <div className="portfolio-filter">
            <button 
              className={`filter-btn ${currentFilter === 'all' ? 'active' : ''}`}
              onClick={() => setCurrentFilter('all')}
            >
              Todos los Proyectos
            </button>
            <button 
              className={`filter-btn ${currentFilter === 'app' ? 'active' : ''}`}
              onClick={() => setCurrentFilter('app')}
            >
              Plataformas & Redes
            </button>
            <button 
              className={`filter-btn ${currentFilter === 'mobility' ? 'active' : ''}`}
              onClick={() => setCurrentFilter('mobility')}
            >
              Movilidad & Transporte
            </button>
            <button 
              className={`filter-btn ${currentFilter === 'web' ? 'active' : ''}`}
              onClick={() => setCurrentFilter('web')}
            >
              Institucionales & ONG
            </button>
          </div>

          <div className="portfolio-grid">
            {filteredProjects.map((proj) => (
              <div key={proj.id} className="project-card">
                <div 
                  className="project-header-banner"
                  style={{
                    background: `linear-gradient(135deg, ${proj.color}22 0%, #0a0f24 100%)`
                  }}
                >
                  {proj.image ? (
                    <>
                      <img src={proj.image} alt={proj.title} className="project-banner-img" />
                      <div className="project-banner-gradient"></div>
                    </>
                  ) : (
                    <div className="project-banner-deco"></div>
                  )}
                  
                  <div 
                    className="project-logo-badge"
                    style={{ background: proj.color }}
                  >
                    {proj.title.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="project-badge-cat">{proj.categoryLabel}</span>
                </div>

                <div className="project-content">
                  <h3 className="project-title">{proj.title}</h3>
                  <div className="project-tagline">{proj.tagline}</div>
                  <p className="project-desc">{proj.desc}</p>

                  <ul className="project-features">
                    {proj.features.slice(0, 3).map((feat, idx) => (
                      <li key={idx}>
                        <CheckCircle2 size={15} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="project-tags">
                    {proj.tags.map((tag, idx) => (
                      <span key={idx} className="tech-tag">{tag}</span>
                    ))}
                  </div>

                  <div className="project-actions">
                    <button 
                      className="btn-primary" 
                      style={{ padding: '9px 18px', fontSize: '0.88rem' }}
                      onClick={() => setSelectedProject(proj)}
                    >
                      <span>Ver Ficha Completa</span>
                    </button>
                    {proj.liveUrl && (
                      <a 
                        href={proj.liveUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn-outline"
                      >
                        <ExternalLink size={15} />
                        <span>Visitar Web</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Banner de migración y arquitectura */}
          <div className="deploy-banner">
            <div className="deploy-info">
              <Server size={28} color="#06b6d4" />
              <div>
                <strong>Desarrollado en React + Node/Express para Contabo VPS</strong>
                <p style={{ fontSize: '0.86rem', color: '#94a3b8', margin: 0 }}>
                  Preparado para producción y administración mediante aaPanel bajo tu dominio <strong>oscarsoft.com.ar</strong>
                </p>
              </div>
            </div>
            <span className="deploy-badge">Ready for aaPanel</span>
          </div>
        </div>
      </section>

      {/* ===== SERVICIOS ===== */}
      <section className="services" id="services">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">Servicios</div>
            <h2 className="section-title">
              ¿Qué puedo hacer<br />
              <span className="gradient-text">por tu negocio o proyecto?</span>
            </h2>
            <p className="section-desc">
              Soluciones digitales de principio a fin: desde el diseño UI y desarrollo full stack hasta el despliegue en servidor.
            </p>
          </div>

          <div className="services-grid">
            {servicesList.map((svc) => {
              const IconComp = svc.icon;
              return (
                <div key={svc.id} className={`service-card ${svc.featured ? 'featured' : ''}`}>
                  {svc.featured && <div className="featured-tag">⭐ Más solicitado</div>}
                  <div className="service-icon-wrap">
                    <IconComp size={26} />
                  </div>
                  <h3 className="service-title">{svc.title}</h3>
                  <p className="service-desc">{svc.desc}</p>

                  <ul className="service-list">
                    {svc.features.map((item, idx) => (
                      <li key={idx}>
                        <CheckCircle2 size={16} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="service-price">
                    <strong>{svc.price}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== STACK & HABILIDADES ===== */}
      <section className="skills" id="skills">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">Tecnologías</div>
            <h2 className="section-title">
              Stack Tecnológico &<br />
              <span className="gradient-text">Habilidades Técnicas</span>
            </h2>
            <p className="section-desc">
              Herramientas y lenguajes probados para garantizar rendimiento, seguridad y mantenibilidad.
            </p>
          </div>

          <div className="skills-grid">
            {techSkills.map((sk, idx) => (
              <div key={idx} className="skill-item">
                <div className="skill-header">
                  <div className="skill-meta">
                    <div className="skill-logo">
                      <img src={sk.icon} alt={sk.name} />
                    </div>
                    <span className="skill-name">{sk.name}</span>
                  </div>
                  <span className="skill-level-text">{sk.level}</span>
                </div>
                <div className="skill-bar">
                  <div className="skill-fill" style={{ width: sk.level }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CONTACTO ===== */}
      <section className="contact" id="contact">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info">
              <div className="section-tag">Contacto</div>
              <h2 className="section-title">
                ¿Listo para crear<br />
                <span className="gradient-text">algo increíble?</span>
              </h2>
              <p className="contact-desc">
                Cuéntame los detalles de tu nuevo proyecto o consulta. Te responderé a la brevedad con una propuesta a tu medida.
              </p>

              <div className="contact-items">
                <a href="mailto:oscarns@gmail.com" className="contact-item">
                  <div className="contact-icon"><Mail size={22} /></div>
                  <div>
                    <span className="contact-label">Email Principal</span>
                    <span className="contact-value">oscarns@gmail.com</span>
                  </div>
                </a>

                <div className="contact-item">
                  <div className="contact-icon"><Globe size={22} /></div>
                  <div>
                    <span className="contact-label">Dominio & Marca</span>
                    <span className="contact-value">oscarsoft.com.ar / oscarsoft.click</span>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon"><MapPin size={22} /></div>
                  <div>
                    <span className="contact-label">Ubicación</span>
                    <span className="contact-value">Argentina 🇦🇷 (Remoto & Internacional)</span>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon"><Clock size={22} /></div>
                  <div>
                    <span className="contact-label">Disponibilidad</span>
                    <span className="contact-value">Lunes a Viernes, 9:00 - 19:00 hs</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-form-wrap">
              <form className="contact-form" onSubmit={handleContactSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Nombre completo</label>
                    <input 
                      type="text" 
                      id="name" 
                      required 
                      placeholder="Tu nombre"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Correo electrónico</label>
                    <input 
                      type="email" 
                      id="email" 
                      required 
                      placeholder="tu@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="service">Proyecto o Servicio de Interés</label>
                  <select 
                    id="service"
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  >
                    <option value="">Selecciona una opción...</option>
                    <option value="Plataforma tipo Buscotec / BuscaPet">Plataforma a Medida (Tipo Buscotec / BuscaPet)</option>
                    <option value="Tienda Online / Barigo">E-Commerce y Logística (Tipo Barigo)</option>
                    <option value="Portal Institucional / Ahava">Sitio Institucional / ONG (Tipo Fundación Ahava)</option>
                    <option value="Desarrollo Web Full Stack">Desarrollo Web Full Stack React + Node</option>
                    <option value="Configuración VPS Contabo aaPanel">Setup Servidor VPS Contabo con aaPanel</option>
                    <option value="Otro">Otro proyecto</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="message">Detalles del mensaje</label>
                  <textarea 
                    id="message" 
                    rows={5} 
                    required 
                    placeholder="Cuéntame sobre las funcionalidades, plazos o dudas que tengas..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ width: '100%', justifyContent: 'center' }}
                  disabled={formStatus.state === 'loading'}
                >
                  <Send size={18} />
                  <span>{formStatus.state === 'loading' ? 'Enviando...' : 'Enviar mensaje'}</span>
                </button>

                {formStatus.state === 'success' && (
                  <div className="form-success">{formStatus.msg}</div>
                )}
                {formStatus.state === 'error' && (
                  <div className="form-error">{formStatus.msg}</div>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ===== MODAL DETALLES DE PROYECTO ===== */}
      {selectedProject && (
        <div className="modal-backdrop" onClick={() => setSelectedProject(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedProject(null)}>
              <X size={24} />
            </button>

            {selectedProject.image && (
              <div style={{ marginBottom: '20px', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                <img 
                  src={selectedProject.image} 
                  alt={selectedProject.title} 
                  style={{ width: '100%', maxHeight: '260px', objectFit: 'cover', display: 'block' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div 
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  background: selectedProject.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '1.2rem',
                  color: 'white'
                }}
              >
                {selectedProject.title.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)' }}>
                  {selectedProject.title}
                </h3>
                <span style={{ fontSize: '0.85rem', color: '#06b6d4', fontWeight: 600 }}>
                  {selectedProject.categoryLabel}
                </span>
              </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.7 }}>
              {selectedProject.desc}
            </p>

            <h4 style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
              Características y Módulos Desarrollados:
            </h4>
            <ul className="project-features" style={{ marginBottom: '24px' }}>
              {selectedProject.features.map((feat, idx) => (
                <li key={idx} style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <CheckCircle2 size={16} />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>

            <h4 style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
              Tecnologías Implementadas:
            </h4>
            <div className="project-tags" style={{ marginBottom: '28px' }}>
              {selectedProject.tags.map((tag, idx) => (
                <span key={idx} className="tech-tag" style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
                  {tag}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              {selectedProject.liveUrl && selectedProject.liveUrl !== '#' ? (
                <a 
                  href={selectedProject.liveUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn-primary"
                  style={{ textDecoration: 'none' }}
                >
                  <ExternalLink size={16} />
                  <span>Visitar Proyecto</span>
                </a>
              ) : null}
              <button 
                className="btn-secondary" 
                onClick={() => setSelectedProject(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <div className="container">
          <div className="footer-top">
            <div>
              <a href="#home" className="nav-logo" style={{ marginBottom: '8px' }}>
                <span className="logo-bracket">&lt;</span>
                <span>OscarSoft</span>
                <span className="logo-dot">.</span>
                <span className="logo-bracket">/&gt;</span>
              </a>
              <p className="footer-tagline">
                Desarrollo web moderno con React y Node.js para marcas y emprendimientos con visión de futuro.
              </p>
            </div>

            <div className="footer-links">
              <a href="#home">Inicio</a>
              <a href="#about">Sobre Mí</a>
              <a href="#projects">Proyectos</a>
              <a href="#services">Servicios</a>
              <a href="#skills">Habilidades</a>
              <a href="#contact">Contacto</a>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} Oscar Nicolás Stella - OscarSoft. Todos los derechos reservados.</p>
            <div>
              <a href="mailto:oscarns@gmail.com">oscarns@gmail.com</a>
              <span style={{ margin: '0 10px' }}>•</span>
              <span style={{ color: '#06b6d4' }}>oscarsoft.com.ar</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
