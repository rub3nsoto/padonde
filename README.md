# Eventure 🌙⚡
**Plataforma de eventos sociales urbanos +18**

> Descubre y crea los mejores eventos de tu ciudad. Fiestas, conciertos, afterparties, networking y más.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Estilos | Tailwind CSS (tema oscuro personalizado) |
| Base de datos | PostgreSQL + Prisma ORM |
| Autenticación | Clerk (social login + email) |
| Mapas | Mapbox GL JS + react-map-gl |
| Storage de media | Cloudinary |
| Pagos | Stripe |
| Email | Nodemailer |
| Animaciones | Framer Motion |

---

## Inicio Rápido

### 1. Prerrequisitos
- Node.js 18+
- PostgreSQL 14+
- Cuentas en: Clerk, Mapbox, Cloudinary, Stripe (para funcionalidades completas)

### 2. Clonar e instalar
```bash
cd eventure
npm install
```

### 3. Variables de entorno
```bash
cp .env.example .env.local
# Completar todas las variables en .env.local
```

### 4. Base de datos
```bash
# Crear la base de datos PostgreSQL primero
createdb eventure

# Aplicar el esquema
npm run db:push

# (Opcional) Cargar datos de ejemplo
npm run db:seed

# Ver la BD con interfaz visual
npm run db:studio
```

### 5. Ejecutar en desarrollo
```bash
npm run dev
# → http://localhost:3000
```

---

## Estructura del Proyecto

```
eventure/
├── prisma/
│   ├── schema.prisma          # Esquema de BD con 6 modelos
│   └── seed.ts                # Datos de ejemplo
├── src/
│   ├── app/
│   │   ├── page.tsx           # Landing page
│   │   ├── explorar/          # Mapa + lista de eventos
│   │   ├── evento/[id]/       # Detalle de evento
│   │   ├── crear/             # Wizard de 8 pasos
│   │   ├── dashboard/         # Panel del organizador
│   │   ├── mis-eventos/       # Eventos del asistente
│   │   ├── perfil/[id]/       # Perfil público
│   │   ├── auth/              # Login + Registro
│   │   ├── legal/             # T&C + Aviso de Privacidad
│   │   └── api/               # Endpoints REST
│   │       ├── events/        # CRUD de eventos
│   │       ├── attendances/   # Gestión de asistencias
│   │       ├── users/         # Gestión de usuarios
│   │       ├── upload/        # Upload de media a Cloudinary
│   │       ├── stripe/        # Checkout + Webhook
│   │       ├── calendar/      # Generación de .ics
│   │       └── notifications/ # Notificaciones
│   ├── components/
│   │   ├── events/            # EventCard, EventFilters
│   │   ├── maps/              # EventMap (Mapbox)
│   │   ├── layout/            # Navbar, NotificationsPanel
│   │   └── modals/            # AgeVerificationModal
│   ├── hooks/                 # useGeolocation, useNotifications
│   ├── lib/                   # prisma, email, cloudinary, stripe, calendar, utils
│   └── types/                 # Tipos TypeScript globales
```

---

## Funcionalidades Implementadas

### Autenticación
- ✅ Registro con Clerk (Google, Apple, email/password)
- ✅ Verificación de mayoría de edad (+18) en registro
- ✅ Modal de verificación en primer acceso
- ✅ Middleware de protección de rutas

### Exploración
- ✅ Vista de mapa interactivo (Mapbox)
- ✅ Vista de lista/grid
- ✅ Geolocalización automática
- ✅ Filtros (tipo, fecha, precio, distancia, disponibilidad)
- ✅ Búsqueda por texto
- ✅ Paginación

### Detalle de evento
- ✅ Carrusel de fotos/videos
- ✅ Mapa interactivo con ubicación
- ✅ Botón "Asistir" (evento público gratuito)
- ✅ Botón "Reservar" → flujo Stripe
- ✅ Botón "Solicitar invitación" (evento por aprobación)
- ✅ Agregar al calendario (.ics + Google Calendar)
- ✅ Compartir link único

### Creación de evento (wizard 8 pasos)
- ✅ Paso 1: Nombre, descripción, tipo, etiquetas
- ✅ Paso 2: Fecha y hora con zona horaria
- ✅ Paso 3: Ubicación con mapa interactivo + geocoding
- ✅ Paso 4: Capacidad (con límite o ilimitada)
- ✅ Paso 5: Privacidad (público / link / aprobación)
- ✅ Paso 6: Precio, código de vestimenta, instrucciones
- ✅ Paso 7: Upload de fotos y videos (Cloudinary)
- ✅ Paso 8: Revisión y publicación con aviso legal

### Dashboard del organizador
- ✅ Métricas (vistas, asistentes, eventos)
- ✅ Lista de eventos con acciones
- ✅ Ver asistentes confirmados
- ✅ Aprobar/rechazar solicitudes pendientes
- ✅ Cancelar evento (con notificación por email)

### Notificaciones
- ✅ Email: confirmación, aprobación, recordatorio, cancelación
- ✅ In-app: panel de notificaciones con polling
- ✅ Badge de contador no leídas en Navbar

### Documentos legales
- ✅ Términos y Condiciones completos (12 secciones)
- ✅ Aviso de Privacidad completo (11 secciones, cumplimiento LFPDPPP)

---

## Configuración de Servicios Externos

### Clerk (Auth)
1. Crear proyecto en [dashboard.clerk.com](https://dashboard.clerk.com)
2. Habilitar proveedores: Google, Apple, Email/Password
3. Copiar `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` y `CLERK_SECRET_KEY`

### Mapbox
1. Crear cuenta en [account.mapbox.com](https://account.mapbox.com)
2. Crear un token público con scope `styles:read` + `geocoding`
3. Copiar a `NEXT_PUBLIC_MAPBOX_TOKEN`

### Cloudinary
1. Crear cuenta en [cloudinary.com](https://cloudinary.com)
2. Crear un Upload Preset "unsigned" llamado `eventure_unsigned`
3. Copiar Cloud Name, API Key y API Secret

### Stripe
1. Crear cuenta en [dashboard.stripe.com](https://dashboard.stripe.com)
2. Copiar claves de prueba (pk_test_ y sk_test_)
3. Para webhooks locales: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

---

## Variables de Entorno Necesarias

Ver `.env.example` para la lista completa.

---

## Decisiones Técnicas

| Decisión | Razón |
|----------|-------|
| Next.js App Router | Server Components para SEO + Client islands para interactividad |
| Clerk sobre NextAuth | Mejor DX, social login out-of-the-box, manejo de sesiones robusto |
| Mapbox sobre Google Maps | Pricing más predecible para MVP, mejor API de React |
| Cloudinary | CDN automático, transformaciones de imagen, generoso tier gratuito |
| Stripe sobre otros | Estándar de la industria, mejor soporte MXN, webhooks robustos |
| Nodemailer sobre Resend | Sin dependencia adicional, reemplazable fácilmente |
| Prisma | Type-safety end-to-end, migraciones declarativas |
| Filtro geoespacial en memoria | Simpleza para MVP; en producción usar PostGIS |

---

## Roadmap (post-MVP)

- [ ] Chat en tiempo real entre asistentes del mismo evento
- [ ] Sistema de reseñas y valoraciones de eventos
- [ ] Verificación de identidad con documento (ID verification)
- [ ] PostGIS para búsquedas geoespaciales a escala
- [ ] Notificaciones push (Web Push API)
- [ ] App móvil (React Native / Expo)
- [ ] Sistema de códigos QR para check-in en el evento
- [ ] Dashboard de analíticas avanzadas

---

## Compliance Legal

- 🇲🇽 Diseñado para cumplir con **LFPDPPP** (México)
- 🔞 Verificación de mayoría de edad en registro y modal de primer acceso
- 📋 Aviso legal en todas las acciones de asistencia
- ⚖️ Exoneración clara de responsabilidad como intermediario tecnológico

---

*Eventure — Hecho para LATAM con ❤️*
