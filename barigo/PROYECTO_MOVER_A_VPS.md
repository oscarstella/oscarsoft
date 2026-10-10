# 🚀 PROYECTO: MIGRACIÓN Y DESPLIEGUE EN VPS PROPIO (HOSTINGER)
**Plataforma de Movilidad Urbana: BariGo - San Carlos de Bariloche**

---

## 📋 1. Objetivo del Proyecto
Independizar la plataforma **BariGo** de servicios de terceros en la nube, migrando toda la infraestructura de base de datos, geolocalización, sincronización en tiempo real (WebSockets), autenticación y webhooks a un **servidor VPS privado en Hostinger**.

### Beneficios Clave:
* **0% comisiones a terceros**: Control total de la infraestructura y costos fijos de servidor.
* **Privacidad de datos**: Información de pasajeros, choferes y viajes almacenada 100% en tu servidor.
* **Sin límites de conexiones en tiempo real**: Capacidad escalable según la memoria y CPU del VPS.
* **Webhooks directos**: Integración directa con pasarelas de pago (Mercado Pago, bancos locales) para cobro de pases diarios a choferes y comisiones.

---

## 🏗️ 2. Estrategias de Despliegue Disponibles

### 🟢 Opción A: Supabase Self-Hosted en Docker (Recomendada)
Supabase es **100% Open Source**. Se puede instalar la suite completa en tu VPS con un contenedor Docker oficial.

* **Ventajas:**
  * **Cero cambios en la app móvil**: Las apps de Pasajero, Chofer y Admin siguen funcionando idénticas, solo cambiando la URL de conexión (`https://api.tudominio.com`).
  * Incluye PostgreSQL 15+, PostGIS (geolocalización de autos), Servidor Realtime WebSockets, Storage para fotos de licencias/autos y panel de control web.
* **Tiempo estimado de implementación:** 1 a 2 horas.

### 🔵 Opción B: Backend Personalizado (Node.js / Fastify / Go + PostgreSQL)
Creación de un servidor API REST propio con WebSockets nativos y gestión de Webhooks.

* **Ventajas:**
  * Máxima ligereza y control milimétrico sobre cada byte de memoria y lógica del servidor.
  * Webhooks a medida para liquidaciones automáticas a choferes.
* **Adaptación en Flutter:**
  * Solo se reemplaza la clase [`lib/core/services/supabase_service.dart`](file:///Users/oscarnicolasstella/Documents/proyectos/barigo/lib/core/services/supabase_service.dart) por un `api_service.dart` que apunte al VPS.

---

## 🛠️ 3. Especificaciones del VPS en Hostinger

| Recurso | Mínimo Recomendado | Ideal para Bariloche (Producción) |
| :--- | :--- | :--- |
| **Plan Hostinger** | KVM 2 / KVM 4 | KVM 4 u 8 |
| **Sistema Operativo** | Ubuntu 22.04 / 24.04 LTS | Ubuntu 24.04 LTS |
| **CPU** | 2 vCPU Cores | 4 vCPU Cores |
| **RAM** | 4 GB a 8 GB | 8 GB a 16 GB |
| **Almacenamiento** | 50 GB NVMe SSD | 100 GB NVMe SSD |
| **Dominio / Subdominio** | `api.barigo.app` o similar | Con certificado SSL Let's Encrypt automático |

---

## 📦 4. Plantilla Docker Compose (Para despliegue rápido en VPS)

Cuando estemos listos en el VPS, crearemos una carpeta `/opt/barigo-server` con el siguiente `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # 1. Base de datos PostgreSQL con extensión PostGIS para geolocalización
  db:
    image: postgis/postgis:15-3.3
    container_name: barigo_db
    restart: always
    environment:
      POSTGRES_DB: barigo_production
      POSTGRES_USER: barigo_admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"

  # 2. Servidor de WebSockets y Tiempo Real para GPS de Choferes
  realtime:
    image: supabase/realtime:v2.28.32
    container_name: barigo_realtime
    restart: always
    environment:
      PORT: 4000
      DB_HOST: db
      DB_PORT: 5432
      DB_NAME: barigo_production
      DB_USER: barigo_admin
      DB_PASSWORD: ${DB_PASSWORD}
      API_JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - db
    ports:
      - "127.0.0.1:4000:4000"

  # 3. Servidor de Webhooks y Pagos (Mercado Pago / Notificaciones)
  webhooks_api:
    image: node:20-alpine
    container_name: barigo_webhooks
    restart: always
    working_dir: /app
    volumes:
      - ./webhooks_server:/app
    environment:
      PORT: 3000
      MP_ACCESS_TOKEN: ${MP_ACCESS_TOKEN}
      DB_CONNECTION: postgres://barigo_admin:${DB_PASSWORD}@db:5432/barigo_production
    command: npm start
    depends_on:
      - db
    ports:
      - "127.0.0.1:3000:3000"

  # 4. Proxy Inverso con SSL Automático (Nginx o Caddy)
  reverse_proxy:
    image: caddy:2-alpine
    container_name: barigo_proxy
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - ./data/caddy_data:/data
```

---

## 🗄️ 5. Esquema de Base de Datos a Migrar

Las tablas que se crearán en el PostgreSQL del VPS corresponden exactamente a los modelos de BariGo:

1. **`users`**: Cuentas de pasajeros, choferes y administradores.
2. **`driver_profiles`**: Datos del vehículo (marca, modelo, color, patente, año), estado de verificación, calificación y estado del pase diario.
3. **`driver_locations`**: Coordenadas GPS en tiempo real (Latitud, Longitud, Rumbo, Velocidad) indexadas con PostGIS para búsquedas por proximidad.
4. **`rides`**: Registro completo de viajes (origen, destino, costo, chofer asignado, estado, método de pago, tiempos de espera).
5. **`fare_settings`**: Tarifario editable en vivo desde el Panel Admin (bajada de bandera, costo por km, minuto de espera, recargo nocturno/nieve).
6. **`driver_passes`**: Control de habilitación y recaudación del pase diario de choferes.

---

## 🔄 6. Configuración en la App Flutter al Momento de Migrar

En el archivo [`lib/core/constants/app_constants.dart`](file:///Users/oscarnicolasstella/Documents/proyectos/barigo/lib/core/constants/app_constants.dart), simplemente se actualizarán las credenciales hacia tu servidor:

```dart
// PRODUCCIÓN: VPS PROPIO DE HOSTINGER
static const String supabaseUrl = 'https://api.tudominio.com'; // O IP de tu VPS
static const String supabaseAnonKey = 'TU_CLAVE_JWT_PRIVADA_DEL_VPS';
```

---

## 📝 7. Pasos de Ejecución para el Futuro (Checklist)

- [ ] **Paso 1:** Contratar VPS en Hostinger con Ubuntu 24.04 LTS.
- [ ] **Paso 2:** Conectar dominio o subdominio (ej: `api.barigo.app`) a la IP del VPS.
- [ ] **Paso 3:** Instalar Docker y Docker Compose en el servidor.
- [ ] **Paso 4:** Ejecutar los scripts SQL de creación de tablas y tarifas oficiales de Bariloche.
- [ ] **Paso 5:** Configurar el webhook de Mercado Pago para procesar los pases diarios.
- [ ] **Paso 6:** Apuntar las apps Flutter (`main_passenger.dart`, `main_driver.dart`, `main_admin.dart`) a la nueva URL del VPS.
- [ ] **Paso 7:** Compilar los instaladores APK/AAB para Google Play y realizar pruebas de campo en Bariloche.

---

*Documento generado y archivado en el repositorio de BariGo para su posterior ejecución.*
