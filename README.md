# OscarSoft - Portafolio Full Stack (React + Node.js + Express)

Sitio web y portafolio profesional de **Oscar Nicolás Stella** desarrollado en **React** (Vite) en el frontend y **Node.js + Express** en el backend.

Preparado para:
- Desarrollo ágil local con recarga en caliente (HMR).
- Despliegue en producción en servidor VPS **Contabo** administrado con **aaPanel** bajo el nuevo dominio **`oscarsoft.com.ar`**.

---

## 🚀 Proyectos Destacados Incluidos

1. **Buscotec**: Plataforma y directorio de servicios y técnicos especializados, con búsqueda por rubro y sistema de cotizaciones.
2. **Fundación Ahava (Haava)**: Sitio institucional y comunitario de acompañamiento oncológico, programas solidarios y recepción de donaciones.
3. **Barigo**: Plataforma e-commerce moderna y sistema logístico con cálculo de envíos en tiempo real y pasarela de cobros.
4. **BuscaPet**: Red comunitaria solidaria para búsqueda de mascotas extraviadas, mapa de avistamientos y gestión de adopciones.

---

## 🛠️ Estructura del Proyecto

```text
oscarsoft/
├── client/                 # Frontend en React con Vite
│   ├── public/             # Imágenes originales (hero.png, oscar_suit.png, favicon)
│   ├── src/
│   │   ├── App.jsx         # Componente principal interactivo
│   │   ├── App.css         # Estilos específicos de componentes
│   │   ├── index.css       # Design System y tokens (Dark mode, glassmorphism)
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js      # Proxy configurado hacia /api en backend
├── server/                 # Backend en Node.js + Express
│   ├── index.js            # Servidor API (/api/projects, /api/services, /api/contact)
│   ├── .env                # Variables de entorno
│   └── package.json
├── package.json            # Scripts unificados para desarrollo con concurrently
└── README.md
```

---

## 💻 Comandos de Desarrollo Local

### 1. Iniciar Frontend y Backend simultáneamente
```bash
npm run dev
```
- **Frontend (Vite):** [http://localhost:5173](http://localhost:5173)
- **Backend API (Express):** [http://localhost:5000](http://localhost:5000)

### 2. Iniciar solo frontend:
```bash
npm run client:dev
```

### 3. Iniciar solo backend:
```bash
npm run server:dev
```

---

## 🌐 Guía de Despliegue en aaPanel (VPS Contabo)

Para subir tu sitio a **aaPanel** con tu dominio **`oscarsoft.com.ar`**:

### Paso 1: Generar el build de producción
En tu máquina o en el servidor:
```bash
npm run client:build
```
Esto crea la carpeta `client/dist`.

### Paso 2: Opción Recomendada en aaPanel (Node Project Manager / PM2)
1. En aaPanel, instala la extensión **Node.js Project Manager** (o **PM2 Manager**).
2. Sube o clona el repositorio en `/www/wwwroot/oscarsoft.com.ar`.
3. Ejecuta `npm install` tanto en la raíz como en `client` y `server`.
4. En **Node.js Project Manager**:
   - **Project Name:** `oscarsoft`
   - **Path:** `/www/wwwroot/oscarsoft.com.ar`
   - **Startup file:** `server/index.js`
   - **Environment:** `NODE_ENV=production`
   - **Port:** `5000`
5. Activa el proyecto. En producción, Express sirve automáticamente la carpeta `client/dist`.

### Paso 3: Mapeo de Dominio y SSL en Nginx (aaPanel)
1. En aaPanel ve a **Website** > **Add site** o edita el sitio creado con el dominio `oscarsoft.com.ar`.
2. En la pestaña **Reverse Proxy**, crea un proxy apuntando a:
   - **Target URL:** `http://127.0.0.1:5000`
3. En la pestaña **SSL**, solicita el certificado Let's Encrypt para `oscarsoft.com.ar` y activa **Force HTTPS**.
