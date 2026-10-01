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

## [1.0.0-build22] - 2026-10-01

### Added
- **Editor de servicios con imagen personalizada**: layout reorganizado en 2 columnas
  (izq "ICONO DEL SERVICIO" con preview 128px + botones **SUBIR IMAGEN** / **QUITAR
  IMAGEN** + select de icono + orden + activo; der "INFORMACIÓN BÁSICA" con nombre,
  categoría+precio y descripción). La imagen se procesa en canvas 128×128: detecta fondo
  (claro → alpha por luminancia, oscuro → alpha por luminancia inversa) y repinta la
  silueta a azul `#60A5FA` estilo lucide; se persiste como `icon = 'img:<dataURL>'`
  (prefijo `IMG_ICON_PREFIX`, server acepta `img:` y validación relajada en
  `server/routes/services.ts`, `express.json` limit a 2mb en `server/index.ts`).

### Changed
- **Modal "Gestionar equipo" con scroll**: panel `max-h-[85vh] flex-col` — header
  shrink-0 + área con `flex-1 min-h-0 overflow-y-auto` con thead sticky + footer
  "MIEMBROS EN EL EQUIPO / CERRAR" shrink-0 anclado al piso (ya no se solapa con la
  tabla al tener pocos/muchos miembros).
- **`.ico` reencuadrado "al piso"**: los frames de `assets/logo-icon.ico` tenían fondo
  sólido `#003366` (sin transparencia); el contenido se detectó por diferencia con el
  color de fondo, se movió al borde inferior (gap 3–60 → 1–5px) y se centró en X
  preservando el fondo opaco. 7 frames validados; backup en
  `assets/logo-icon-user-original.ico`. Verificado visualmente en atajo del escritorio
  y taskbar.

### Fixed
- NSIS: instalador de build22 (ASAR 14:30) reemplazó el de build21 en la instalación
  existente (intento 1, sin bloqueos).

## [1.0.0-build21] - 2026-09-30

### Changed
- Build21 instalada (NSIS intento 1, ASAR 14:04).
- **Icono de la aplicación**: `assets/logo-icon.ico` (proporcionado por el usuario,
  `TeknoTech-Services.ico`) aplicado a `win.icon` de electron-builder (atajo del escritorio
  e instalador) y al `icon` de la ventana (`src/main/index.ts`); atajo del escritorio
  recreado para refrescar el icono. Verificado visualmente en el escritorio.

## [1.0.0-build20] - 2026-09-29

### Added
- **Cotizaciones — gestión real**: barra de gestión con contador + "Buscar cotización" +
  filtro por estado; por fila se añadieron **cambio de estado rápido** (PUT optimista) y
  **Duplicar cotización**; se mantiene editar/eliminar en 2 pasos.
- **Ajustes — Preferencias de la aplicación** (tab Cuenta, todos los roles): toggle
  "Reducir animaciones" (clase `.reduced-motion` + regla en globals.css), select
  "Cotizaciones recientes en Inicio" (5/10/15 → `localStorage nt_prefs.recentLimit`) y
  "Restablecer preferencias".
- **Ajustes — logo estilo app**: cualquier imagen subida se procesa en canvas (chroma-key
  de fondo claro, 512×512, fondo `#0A182E`, esquinas redondeadas 18%) → dataURL PNG.

### Changed
- Build20 instalada (NSIS bloqueado 3× → fallback copia de `win-unpacked`, ASAR 22:19).
- **Servicios**: editor con layout 2 columnas (preview grande del icono + icono/orden/activo
  a la izquierda; nombre/categoría/precio/descripción a la derecha), chip de categoría en el
  header, footer alineado a la derecha, modal `max-w-2xl`; catálogo con badges coherentes.
- **Equipo**: stats pills (Total/Activos/Desarrolladores/Vendedores), tabla de devs y cards
  de miembros con avatares anillados + badges de rol/estado, modal de gestión con icon chip,
  filas con más aire y footer sticky "N MIEMBROS EN EL EQUIPO / Cerrar".
- **Inicio — Cotizaciones recientes**: filas con más aire (`py-3.5`), scroll interno
  (`max-h-[420px]`, scrollbar `.scroll-thin`), límite de filas configurable desde Ajustes,
  columnas N°/CLIENTE/TOTAL/ESTADO intactas.
- **Logo de la aplicación**: sidebar y login usan el lobo sobre **tile navy redondeado**
  (estilo de la imagen de referencia); `assets/logo-icon.png` regenerado en navy `#10233E`
  (512px, usado por ventana e instalador; backup `logo-icon-black.png`).

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
