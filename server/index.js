const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5050;

// Middleware
app.use(cors());
app.use(express.json());

// Proyectos destacados de Oscar Stella
const projectsData = [
  {
    id: "buscotec",
    title: "Buscotec",
    category: "app",
    categoryLabel: "Plataforma de Servicios",
    tagline: "Directorio & Conexión de Técnicos y Profesionales",
    desc: "Plataforma integral diseñada para conectar clientes que necesitan reparaciones, mantenimiento y servicios técnicos con profesionales verificados en tiempo real. Incluye sistema de presupuestos, perfiles y valoraciones.",
    image: null,
    color: "#6366f1",
    tags: ["React", "Node.js", "Express", "PostgreSQL / MySQL", "REST API"],
    features: [
      "Búsqueda geolocalizada de especialistas por rubro",
      "Solicitud de cotizaciones y mensajería directa",
      "Calificaciones, reputación y perfiles verificados",
      "Panel de gestión para prestadores de servicios"
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
    tags: ["React", "UI/UX accesible", "Pasarela de Donaciones", "Node.js"],
    features: [
      "Difusión transparente de talleres, pelucas y contención",
      "Módulo de donaciones seguras y padrón de voluntarios",
      "Diseño empático, cálido y 100% responsivo",
      "Gestión de eventos solidarios y testimonios"
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
      "Solicitud de viajes y detección de choferes en vivo en Bariloche",
      "Seguimiento GPS de origen a destino con detección automática",
      "Tarificación transparente, historial de viajes y comprobantes",
      "Sistema de seguridad, perfiles verificados y calificaciones"
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
    tags: ["React", "Express", "Geolocalización", "Cloudinary", "MongoDB / SQL"],
    features: [
      "Publicación instantánea con fotos, raza y última ubicación",
      "Mapa interactivo con filtros de cercanía",
      "Sistema de adopciones con fichas médicas y requisitos",
      "Generación automática de carteles de 'Se Busca' listos para imprimir/compartir"
    ],
    liveUrl: "https://buscapet.click/",
    githubUrl: "#"
  }
];

// Servicios
const servicesData = [
  {
    id: "svc-web",
    title: "Sitios Web a Medida",
    desc: "Diseño y desarrollo sitios web únicos, modernos y ultrarrápidos que representan tu marca con máxima elegancia y convierten visitas en oportunidades reales.",
    price: "Desde $300 USD",
    features: ["Diseño exclusivo y moderno", "Responsive en todo dispositivo", "Optimización SEO y Performance", "Carga ultra fluida"],
    icon: "Globe"
  },
  {
    id: "svc-ecommerce",
    title: "Tienda Online (E-Commerce)",
    featured: true,
    desc: "Potencia tus ventas con una tienda online profesional, rápida y segura. Conexión directa a pasarelas de pago, cálculo de logística y stock automatizado.",
    price: "Desde $600 USD",
    features: ["Panel de administración intuitivo", "Integración MercadoPago / Stripe / PayPal", "Gestión de inventario y pedidos", "Reportes y métricas de ventas"],
    icon: "ShoppingBag"
  },
  {
    id: "svc-webapp",
    title: "Aplicaciones Web Full Stack",
    desc: "Desarrollo sistemas a medida: portales empresariales, CRMs, plataformas SaaS y paneles de administración con arquitectura escalable Node + React.",
    price: "Desde $800 USD",
    features: ["Single Page Apps (SPA) reactivas", "APIs REST seguras y documentadas", "Autenticación, tokens JWT y roles", "Bases de datos optimizadas"],
    icon: "Layers"
  },
  {
    id: "svc-mobile",
    title: "Apps Móviles",
    desc: "Aplicaciones móviles multiplataforma (iOS y Android) con Flutter o React Native, ofreciendo rendimiento fluido y diseño nativo refinado.",
    price: "Desde $1,000 USD",
    features: ["iOS y Android con base compartida", "Push Notifications y geolocalización", "Consumo de APIs en tiempo real", "Preparado para App Store y Play Store"],
    icon: "Smartphone"
  },
  {
    id: "svc-seo",
    title: "SEO & Optimización Web",
    desc: "Auditoría integral y aceleración de tiempos de carga para alcanzar puntuaciones de 90+ en Google Lighthouse y posicionar en los primeros resultados.",
    price: "Desde $200 USD",
    features: ["Auditoría Core Web Vitals", "Minificación y compresión de recursos", "Estructura semántica para motores de búsqueda", "Indexación en Google Search Console"],
    icon: "TrendingUp"
  },
  {
    id: "svc-maintenance",
    title: "Mantenimiento & Servidores (VPS/aaPanel)",
    desc: "Gestión técnica, backups automáticos, configuración de servidores Nginx/Node en VPS (Contabo, DigitalOcean) y soporte continuo garantizado.",
    price: "Desde $80 USD/mes",
    features: ["Configuración de aaPanel y Nginx", "Gestión de procesos con PM2", "Certificados SSL automáticos (HTTPS)", "Soporte técnico preferencial"],
    icon: "Server"
  }
];

// Endpoints API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    domain: 'oscarsoft.com.ar',
    developer: 'Oscar Nicolás Stella'
  });
});

app.get('/api/projects', (req, res) => {
  res.json(projectsData);
});

app.get('/api/services', (req, res) => {
  res.json(servicesData);
});

// Endpoint para recibir contactos desde el formulario
app.post('/api/contact', async (req, res) => {
  const { name, email, service, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Por favor completa nombre, email y mensaje.' });
  }

  console.log(`[Nuevo Contacto Recibido]
  Nombre: ${name}
  Email: ${email}
  Servicio: ${service || 'No especificado'}
  Mensaje: ${message}
  Fecha: ${new Date().toLocaleString()}
  `);

  // Aquí se puede agregar nodemailer fácilmente cuando configures tu SMTP
  return res.json({
    success: true,
    message: '¡Gracias por contactarme! Recibí tu mensaje y te responderé a la brevedad.'
  });
});

// Proxy API requests from oscarsoft.com.ar/api/barigo al backend BariGo (puerto 5055)
app.use('/api/barigo', async (req, res) => {
  try {
    const targetUrl = `http://127.0.0.1:5055/api${req.url}`;
    const headers = { ...req.headers };
    delete headers.host;
    delete headers.connection;

    const options = {
      method: req.method,
      headers
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
      options.body = JSON.stringify(req.body);
      headers['content-type'] = 'application/json';
    }

    const response = await fetch(targetUrl, options);
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await response.json();
      return res.status(response.status).json(data);
    } else {
      const text = await response.text();
      return res.status(response.status).send(text);
    }
  } catch (err) {
    return res.status(502).json({
      error: 'BariGo Backend no disponible en puerto 5055',
      details: err.message
    });
  }
});

// Servir BariGo Web en /barigo
const barigoDistPath = path.join(__dirname, '../barigo/web/dist');
if (fs.existsSync(barigoDistPath)) {
  app.use('/barigo', express.static(barigoDistPath));
  app.use((req, res, next) => {
    if (req.originalUrl === '/barigo' || req.originalUrl.startsWith('/barigo/')) {
      return res.sendFile(path.join(barigoDistPath, 'index.html'));
    }
    next();
  });
}

// Servir Ticket Patagonia Web en /ticketpatagonia
const ticketPatagoniaDistPath = path.join(__dirname, "../ticketpatagonia/dist");
if (fs.existsSync(ticketPatagoniaDistPath)) {
  app.use("/ticketpatagonia", express.static(ticketPatagoniaDistPath));
  app.use((req, res, next) => {
    if (req.originalUrl === "/ticketpatagonia" || req.originalUrl.startsWith("/ticketpatagonia/")) {
      return res.sendFile(path.join(ticketPatagoniaDistPath, "index.html"));
    }
    next();
  });
}

// Servir archivos estáticos del frontend principal React compilado
const distPath = path.join(__dirname, '../client/dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // En Express 5, la ruta comodín debe ser un middleware de fallback
  app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('<h1>OscarSoft API Online</h1><p>El backend de Node y Express está funcionando correctamente.</p>');
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Servidor OscarSoft corriendo en http://localhost:${PORT}`);
});
