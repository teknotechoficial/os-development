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
- Build15 instalado (NSIS, instalación silenciosa `/S` verificada).
- Header: eliminado el botón "SALIR" suelto (logout disponible en el menú de avatar →
  "Cerrar sesión").
- `author` añadido a `package.json` (elimina warning de electron-builder).

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
