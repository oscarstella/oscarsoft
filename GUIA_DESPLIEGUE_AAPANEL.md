# Guía Definitiva: Despliegue de Web Apps (React + Node.js + Express) en VPS Contabo con aaPanel

Esta guía documenta el flujo paso a paso, optimizado y sin rodeos, para desplegar cualquier aplicación web Full Stack moderna desde cero en tu servidor VPS con Ubuntu y aaPanel.

---

## 📋 Resumen del Flujo de Trabajo

```
[Desarrollo Local] 
       ↓ 
1. Build de React (client/dist) + Ajuste Express
       ↓
2. Delegación en Nic.ar (DNS de Contabo)
       ↓
3. Creación de Zona DNS en Panel Contabo
       ↓
4. Subida de Archivos a aaPanel (/www/wwwroot/tu-dominio)
       ↓
5. Alta del Proyecto en aaPanel (Nginx Proxy + PM2)
       ↓
6. Emisión del Certificado SSL (Let's Encrypt / HTTPS)
```

---

## 🛠️ PASO 1: Preparación del Código en Local

Antes de subir cualquier archivo al servidor:

1. **Compilar el Frontend (React / Vite)**:
   ```bash
   npm --prefix client run build
   ```
   Esto genera la carpeta optimizada `client/dist`.

2. **Asegurar la ruta en Express (`server/index.js`)**:
   En Express v5, para servir el frontend y evitar errores con `path-to-regexp`, la captura de rutas SPA debe ser un middleware de fallback:
   ```javascript
   const distPath = path.join(__dirname, '../client/dist');
   if (fs.existsSync(distPath)) {
     app.use(express.static(distPath));
     app.use((req, res) => {
       res.sendFile(path.join(distPath, 'index.html'));
     });
   }
   ```

3. **Qué archivos subir y qué NO**:
   - ✅ **Subir**: `client/dist`, `server/`, `package.json`, `ecosystem.config.js`.
   - ❌ **NUNCA subir**: `node_modules` (se instalan solos en el servidor).

---

## 🌐 PASO 2: Configuración de Dominio y DNS

### A. En Nic.ar / Trámites a Distancia
1. Ir a **Mis Dominios** > **Delegar**.
2. Agregar de a uno los servidores DNS de Contabo:
   - `ns1.contabo.net`
   - `ns2.contabo.net`
   - `ns3.contabo.net`
3. Hacer clic en **Ejecutar Cambios**.

### B. En el Panel de Contabo (new.contabo.com)
1. Ir a **Servicios de Red** > **Gestión DNS** > pestaña **Gestión de zona DNS**.
2. Hacer clic en **+ Crear Zona**:
   - **Nombre de dominio:** `tudominio.com.ar`
   - **Dirección IP:** Seleccionar tu IP del VPS (ej: `62.84.179.78`).
3. Guardar. *(Esto vincula de inmediato los servidores DNS de Contabo con tu máquina).*

---

## 📂 PASO 3: Subida a aaPanel

1. Entrar a tu panel: `https://TU_IP:21062/TU_RUTA_SECRETA`
2. Ir a la sección **Archivos** (*Files*).
3. Entrar a `/www/wwwroot/` y crear la carpeta de tu sitio (ej: `/www/wwwroot/tudominio.com.ar`).
4. Subir los archivos:
   - Podés subir un `.zip` con `client/dist`, `server`, `package.json` y descomprimirlo con clic derecho > **Descomprimir**.
   - La estructura debe quedar limpia:
     ```text
     /www/wwwroot/tudominio.com.ar/
     ├── client/
     │   └── dist/
     │       ├── index.html
     │       └── assets/
     ├── server/
     │   ├── index.js
     │   └── .env
     └── package.json
     ```

---

## ⚙️ PASO 4: Puesta en Marcha en aaPanel (Node.js + PM2)

1. En aaPanel, ir a **Sitio web** > pestaña **Proyecto Node.js**.
2. Clic en **Añadir proyecto**:
   - **Camino:** `/www/wwwroot/tudominio.com.ar`
   - **Nombre del proyecto:** letras simples sin puntos ni símbolos (ej: `miapp`).
   - **Ejecutar usuarios:** Seleccionar **`root`** (o el usuario con el que esté instalado Node en el NVM del panel).
   - **Orden de inicio:** Elegir **Comando personalizado** y escribir:
     ```text
     node server/index.js
     ```
   - **Puerto del proyecto:** El puerto configurado en el backend (ej: `5050`).
   - **Instalar dependencia:** Activado en verde.
3. Clic en **Confirmar**.
4. En la configuración del proyecto recién creado, ir a **Gerente de dominio** y agregar:
   ```text
   tudominio.com.ar
   www.tudominio.com.ar
   ```

---

## 🔒 PASO 5: Certificado SSL (HTTPS / Candado Verde)

Una vez que la zona DNS en Contabo ya responde hacia la IP de tu VPS:

1. En aaPanel, dentro de la configuración del proyecto, ir a la pestaña **SSL** > **Vamos a cifrar** (*Let's Encrypt*).
2. Marcar tu dominio y hacer clic en **Aplicar**.
3. Activar la opción **Forzar HTTPS** (*Force HTTPS*).

*(Alternativamente, por terminal SSH con certbot)*:
```bash
certbot certonly --webroot -w /www/wwwroot/tudominio.com.ar -d tudominio.com.ar -d www.tudominio.com.ar
```

---

## 💡 Lecciones Clave y Consejos Prácticos

1. **Por qué usar PM2**: Con PM2 (`pm2 start ... && pm2 save && pm2 startup`), si el VPS se reinicia por mantenimiento o falla de energía, tu web vuelve a levantarse sola al 100% sin intervención humana.
2. **Puerto ocupado o 502 Bad Gateway**: Si Nginx tira 502, casi siempre significa que el script de Node se apagó por un error de sintaxis en el código o que el puerto del archivo `.js` no coincide con el puerto configurado en Nginx (`proxy_pass`).
3. **No subir node_modules por web**: Subir miles de archivos pequeños sueltos por el navegador satura la subida. Siempre es mejor comprimir en un `.zip` sin `node_modules` y descomprimir en un clic en el servidor.
