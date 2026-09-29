# Changelog - TeknoTech Services Cotizador

Formato basado en [Keep a Changelog](https://keepachangelog.com/).

## [1.0.0] - 2026-09-28

### Added
- Lote 13: tarjeta TAREAS PENDIENTES con CRUD real (tabla `tasks`, API `/api/tasks`),
  modo Gestionar cotizaciones (editar/eliminar en 2 pasos, `DELETE /api/quotes/:id`),
  fichas de equipo clickeables (PersonModal), modal difuminado "Gestionar equipo",
  categoría libre de servicios, Ajustes rediseñado (sin RESUMEN, grid Empresa+SMTP),
  búsqueda del header como dropdown inline, sidebar con orden nuevo
  (Inicio, Nueva Cotización, Equipo, Cotizaciones, Servicios, Historial, Reportes, Ajustes).
- Animaciones: transición de páginas, hover-lift en tarjetas, stagger-in en tablas/listas,
  entrada de dropdowns, indicador activo del sidebar, banner de Settings, tachado animado
  de tareas; `prefers-reduced-motion` respetado, sin dependencias nuevas.
- Segunda ola de animaciones: count-up en StatCards, check animado de tareas, glow en
  botones primarios, modales con spring, colapsables con altura animada, shimmer en
  skeletons, pop-in de badges, hover en filas de tabla.
- Equipo: botón "Gestionar equipo" en el header (junto a "Agregar nuevo miembro") que
  abre directamente el modal de gestión (tabla MIEMBRO/CÓDIGO/SECTOR/ACCIONES).
- E2E: suite de 5 probes (`verify-b13/c/d/b2/v5`) sobre la app instalada → **5/5 verde**,
  `verify-b13` 63/63.

### Changed
- Sidebar reordenado: Inicio → Reportes → Cotizaciones → Nueva Cotización → Servicios →
  Equipo → Historial → Ajustes.
- Difuminados (backdrops de modales) en pantalla completa: los modales de Equipo,
  Persona y Servicios ahora se portalizan a `document.body` (`createPortal`), ya que
  dentro de `animate-page-in` su transform rompía `position: fixed` y el backdrop quedaba
  anclado al contenedor (medía y=24/h=viewport-24 en vez de cubrir todo).
- Header: eliminado el botón "SALIR" suelto (logout disponible en el menú de avatar →
  "Cerrar sesión").
- Historial (`/historial`): eliminado el botón "Gestionar cotizaciones" (solo queda en
  `/cotizaciones`); "Nueva Cotización" se mantiene en ambas.
- `author` añadido a `package.json` (elimina warning de electron-builder).

### Fixed
- Cotizaciones demo restauradas vía re-seed (faltaban `demo-quote-03` y `demo-quote-08`).

## [1.0.0-build19] - 2026-09-29

### Added
- **Ajustes con tabs** (`Cuenta` / `Empresa` / `Correos`): tablist `role="tablist"` con
  paneles; no-managers ven solo Cuenta.
- Tab Empresa: campo **Margen mínimo (%)** (`settings-margin` → `marginMinimum`) y
  **subida real de logo** (file input → resize canvas máx 320px → JPEG dataURL, preview +
  "Quitar logo" + opción de pegar URL).
- Tab Cuenta: cabecera con **avatar real** (antes solo iniciales).
- **Perfil ampliado** (`ProfileModal`): edición de **Nombre** y **Email**
  (`PUT /api/team/:id`), botón "Cambiar credenciales" (navega a Ajustes), y el modal ahora
  usa `createPortal` a `document.body`.
- **ImageCropper**: componente nuevo de recorte de foto con **zoom (1–4x) + arrastre**
  sobre círculo, salida JPEG 160×160 (antes: recorte automático centrado sin control).
- `auth.updateUser(partial)` en el store de auth para refrescar el header tras editar
  perfil.
- E2E: probe b13 ampliado a **76 checks** (sección 5 por tabs + nueva sección 7 de
  perfil); verify-c con bloque SETTINGS (tabs=3).

### Changed
- Build19 instalada (NSIS intento 1, ASAR 20:18).

### Fixed
- Cotizaciones demo restauradas vía re-seed (faltaban `demo-quote-03` y `demo-quote-08`).

## [0.9.0] - 2026-09-27

### Added
- Lote 7: dashboard ajustado al boceto, Ajustes al fondo, StatCard navy uniforme,
  ficha de empleado en reportes, Gestionar servicios (solo CEO), búsqueda con lupa.
- Sidebar sin dividers y con logo 56px.

## [0.8.0] - 2026-09-26

### Added
- Login de 2 métodos (código+PIN y contraseña) con checkbox "Mantener sesión iniciada",
  SetupCredentials (primer ingreso), Recover en 2 pasos, lockout 5 fallos/15 min (HTTP 423).
- Páginas: Services (catálogo + COTIZAR), Reports (KPIs + CSV), QuoteHistory,
  Settings (MI CUENTA + SMTP con test-mail).

## [0.7.0] - 2026-09-25

### Added
- Rediseño dark total al estilo mockup (tema navy `#0A182E`, sidebar `#081426`,
  primario `#1877E8`, Orbitron + Chakra Petch).
- Instalador NSIS con `file://` + Express embebido (puerto 3001) y PostgreSQL 16 local.
