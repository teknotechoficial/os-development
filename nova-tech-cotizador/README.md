# TeknoTech Services Cotizador

Sistema de cotización de software para el equipo de **TeknoTech Services** (antes Nova Tech).

Aplicación de escritorio (Electron) con backend local Express + PostgreSQL 16, autenticación propia (scrypt) y panel por roles.

## Características

- ✅ Cotizador de software con margen mínimo de **$250 USD** o 15% del precio base (lo que sea mayor)
- ✅ 5 roles: **CEO** (super admin), **Gerente General**, **Vendedor**, **Closer de Ventas**, **Desarrollador**
- ✅ Login por contraseña o por **código + PIN de 4 dígitos** (toggle), "Mantener sesión iniciada"
- ✅ Seguridad: scrypt (N=16384), lockout 5 intentos fallidos / 15 min, recuperación de acceso por correo (SMTP configurable)
- ✅ Disponibilidad de desarrolladores (Disponible / Ocupado / No Disponible) con delegación en la cotización
- ✅ Equipo: alta de miembros, cambio de sector, restablecer acceso (CEO / Gerente)
- ✅ Lupa de búsqueda global con resumen de actividad por empleado (CEO / Gerente)
- ✅ Notificaciones en tiempo real, historial archivado, reportes con exportación CSV
- ✅ Generación de PDF y envío por WhatsApp
- ✅ Sin scroll en login, interfaz dark navy estilo boceto

## Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS 3.4 + lucide-react + Zustand v5
- **Desktop**: Electron 30 (HashRouter, context isolation)
- **Backend**: Express 4 embebido (puerto 3001) + nodemailer 10
- **Base de datos**: PostgreSQL 16 local
- **Build**: Vite 5 + tsc (main) + electron-builder (NSIS)
- **Testing**: E2E por CDP (Chrome DevTools Protocol) sobre la app empaquetada/instalada

## Instalación

```bash
cd nova-tech-cotizador
npm install
npm run db:init      # esquema
npm run db:seed      # usuarios y servicios demo
npm run dev          # vite + electron (modo desarrollo)
```

Build e instalador:

```bash
npm run build        # tsc main + vite renderer
npx electron-builder --win nsis   # release/TeknoTech Services Cotizador Setup 1.0.0.exe
```

## Estructura

```
src/
├── main/           # Electron main process (ventana, server, IPC, DB)
├── renderer/       # React frontend
│   ├── pages/      # Páginas de la app
│   ├── components/ # Componentes reutilizables (AppLayout, DeveloperSelector, ui)
│   └── store/      # Zustand stores
├── shared/         # Constantes, tipos, lógica de precios
└── preload.ts      # Electron preload
server/             # Backend API (auth, quotes, team, availability, settings, ...)
database/           # Schema, seed
tests/              # Tests automatizados
```

## Roles y Permisos

| Rol | Cotizar | Ver cotizaciones | Equipo | Lupa/Resumen | Disponibilidad |
|-----|---------|------------------|--------|--------------|----------------|
| CEO | ✅ | ✅ Todas | ✅ Alta + gestionar | ✅ | ✅ |
| Gerente General | ✅ | ✅ Todas | ✅ Gestionar | ✅ | ✅ |
| Vendedor | ✅ | ✅ Propias | ❌ | ❌ | Ver devs |
| Closer de Ventas | ✅ | ✅ Propias | ❌ | ❌ | Ver devs |
| Desarrollador | ❌ | ✅ Delegadas | ❌ | ❌ | ❌ |

## Credenciales de prueba

- **CEO001 / `clave123` / PIN `1234`** (Sebastian, única con credenciales preconfiguradas)
- Resto de usuarios: primer ingreso con su código crea contraseña + PIN (`/setup`)
- Lockout de prueba: 5 intentos fallidos → 15 min (HTTP 423)

> **Pendiente**: reemplazar correos seed (`*@novatech.com`) y datos de contacto por los reales del equipo; configurar SMTP con Gmail App Password para recuperación por correo.

## Margen

Todas las cotizaciones aplican un margen mínimo de **$250 USD** o el 15% del precio base, lo que sea mayor.
