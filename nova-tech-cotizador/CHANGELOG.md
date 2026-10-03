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

## [1.0.0-build27] - 2026-10-03

### Added
- **Ajustes totalmente configurables** (ajustes.piso/margen, nombre del programa,
  equipo y sistema — todo con efecto real):
  - **Piso de venta configurable**: nueva columna `settings.margin_minimum`
    (default 250, rango -5→400); `POST /api/quotes` lee el piso de la BD (deja
    de usar el hardcode 250), `NewQuote` lo lee vía `GET /api/settings/public`
    y `calculateFinalPrice(base, floor)` lo recibe por parámetro;
    `minSaleMessage(floor)` muestra "El mínimo de venta es de {formatCurrency}".
  - **Moneda configurable** (`settings.currency`: USD/EUR/ARS/GBP): endpoint
    `GET /api/settings/public` (sin secretos SMTP) que expone companyName,
    currency, notifInterval, marginMinimum, teamDefaultRole/Title, phone,
    email, paymentAlias/Titular; `formatCurrency` en `validators.ts` con
    símbolo+locale por moneda (USD $ es-AR, EUR € es-ES, ARS AR$ es-AR,
    GBP £ en-GB) leyendo `nt_prefs.currency` vía `globalThis.localStorage`
    (seguro para tsconfig.main); AppLayout sincroniza la preferencia guardada
    al iniciar; PriceBreakdown/QuotePreviewCard/QuoteDetail en la moneda elegida.
  - **Nombre del programa configurable** (`settings.companyName`): sidebar
    partido en 2 líneas (primera palabra / resto en mayúsculas), footer,
    título de notificaciones y título de ventana Electron
    (`${companyName} Cotizador` vía IPC `set-title` con reintentos).
  - **Panel Equipo** (tab de 5): altas por defecto `team_default_role` +
    `team_default_title`, tabla de miembros con cargo/estado, fila CEO con
    badge de solo-lectura y `PUT /api/team` aceptando `isActive` con guarda
    400 al desactivar al CEO (RETURNING con `is_active`).
  - **Panel Sistema**: moneda, intervalo de alertas (5–300 s → poll de
    notificaciones dinámico), intentos de login (3–20) y bloqueo (1–120 min)
    con mensaje 423 dinámico en `auth.ts` (`getLockoutConfig` + ventana
    `NOW() - ($2::int * INTERVAL '1 minute')`).
  - Migraciones ×3 (`database/schema.ts`, `server/db.ts`,
    `src/main/database.ts`): 6 columnas nuevas en `settings`.
- **Equipo reorganizado por puesto**: `TeamManager` agrupa "Miembros del
  equipo" por `ROLE_ORDER` (CEO → Gerente → Vendedor → Closer → Desarrollador)
  con headers jerárquicos + conteo, orden alfabético interno; alta con campo
  "Cargo" (`#member-title`) que aplica el default del rol en la BD.

### Changed
- **Ajustes pasa de 3 a 5 tabs**: `Cuenta / Empresa / Equipo / Sistema /
  Correos`; subtítulo "Empresa, equipo, sistema, correos y tu cuenta";
  probes `verify-b13` (5.3/5.5a) y `verify-settings-new` (1.1/2.1)
  actualizados de 3 → 5 tabs; contrato sin palabra "resumen" intacto.
- `minSaleMessage` y el chip "Mínimo de venta" del preview usan
  `formatCurrency` (sin "$250 USD" hardcodeado) para ser coherentes con la
  moneda display.

### E2E
- Suite completa tras build (NSIS exit 0 sin bloqueos, ASAR 40,840,077 @
  01:25, tsc 0/0, vite OK): **212/212 checks verdes** — `verify-b27`
  **37/37** (API+validaciones, piso 300/suma/250, equipo isActive/cargo/CEO,
  5 tabs, moneda EUR end-to-end, nombre de programa, agrupado por puesto,
  restauración total), `verify-b13` **78/78**, `verify-b25` **40/40**,
  `verify-settings-new` **24/24**, `verify-b25-server` **33/33**,
  `verify-c/d/b2/v5` exit 0, 0 excepciones/0 console errors.
- Incidente resuelto: las credenciales de gerente/vendedor quedaron en estado
  seed (`has_credentials=false`) tras el cierre build26 → logins de roles
  fallaban (401); restauradas con el flujo nativo `POST /api/login {code}` →
  `POST /api/auth/setup` (GTE001/VEN001, password `clave123`, pin `1234`) y
  **dejadas activas** para que la suite de roles sea reproducible; el lockout
  dinámico de build27 se verificó en `verify-v5` (5 intentos → 423 "…por 15
  minutos").
- Capturas: `b27-ajustes-equipo.png`, `b27-ajustes-sistema.png`,
  `b27-moneda-eur.png` (precios en €), `b27-nombre-programa.png`,
  `b27-equipo-puestos.png`.

## [1.0.0-build26] - 2026-10-03

### Fixed
- **MÉTODO DE COTIZACIÓN CORREGIDO (crítico)** — la app sumaba un "margen" encima
  de la base en vez de usar el método real de venta:
  - **Total = suma de los precios de los servicios seleccionados** (ej: sistema a
    medido $300 + landing $250 → **$550**, no $800).
  - **Piso de venta de $250 USD**: si la suma queda por debajo, se cobra $250
    (ej: solo un servicio de $150 → total $250).
  - `calculateFinalPrice(basePrice) = max(basePrice, 250)` en
    `src/shared/pricing.ts`; eliminados `calculateSuggestedMargin`,
    `isValidMargin`, `PERCENTAGE_MARGIN_RATE` y `MARGIN_MIN_MESSAGE`
    (reemplazado por `MIN_TOTAL_MESSAGE = 'El mínimo de venta es de $250 USD'`).
  - **Server**: `POST /api/quotes` ya no valida/acepta `margin` del body (se
    ignora si viene); `final = max(base, 250)` con `base = Σ items` (o la base
    legacy del configurador), `margin` persistido = `final - base` (0 cuando la
    suma supera el piso). Ruta sin-items conserva compatibilidad de esquema.
  - **UI**: eliminado el input "Tu margen (USD)" y el botón "Usar sugerido" de
    Nueva Cotización; PriceBreakdown muestra Servicios → Subtotal →
    **Precio Final = suma exacta**, y cuando aplica el piso agrega la fila
    naranja **"Mínimo de venta"** con `MIN_TOTAL_MESSAGE`; nota "Total a cobrar:
    la suma de los servicios seleccionados". QuoteDetail: "Subtotal servicios"
    + fila "Mínimo de venta" solo cuando `margin > 0`.
  - **Ajustes**: label `settings-margin` "Margen mínimo (%)" → **"Mínimo de
    venta (USD)"** (el valor 250 era USD, no %); preview de cotización chip
    "Margen mínimo: X%" → "Mínimo de venta: $X USD" (ambos labels corrigen un
    bug semántico preexistente; el id `settings-margin` se conserva intacto
    para compatibilidad con `verify-b13` 5.5b).

### E2E
- Suite completa tras build (NSIS intento 1 sin bloqueos, setup 80.6 MB,
  ASAR 40.8 MB): probes de precio **reescritos al método nuevo** —
  `verify-b25-server` **33/33** (suma 450 → 450 exacto sin aditivo, servicio
  $150 → piso 250 con margin 100, body `margin:100` ignorado → 200,
  legacy `max(base,250)`), `verify-b25` **40/40** (sin input margen, final =
  suma exacta 450, caso piso $150 → $250 con fila/naranja, quote guardada
  `finalPrice=basePrice, margin=0`), `verify-b13` **78/78**,
  `verify-settings-new` **24/24**, `verify-c/d/b2/v5` exit 0, tsc 0/0,
  vite OK, 0 excepciones/0 console errors.
- Capturas verificadas: `b25-nueva-cotizacion-seleccion.png` (nota "Total a
  cobrar: la suma de los servicios seleccionados") y `b26-piso-250.png`
  (servicio $150 solo → "El mínimo de venta es de $250 USD").
- Credenciales de prueba gerente/vendedor habilitadas para el E2E de roles y
  restauradas al estado seed (`has_credentials=false`); `login_attempts`
  limpio; app/servidor cerrados (`restantes=0`).

## [1.0.0-build25] - 2026-10-03

### Added
- **Nueva Cotización multi-servicio** (recreado, 268 líneas): Paso 2 carga el
  catálogo real de `GET /api/services` (solo activos, empty state "Sin servicios
  disponibles"), selección múltiple con suma en vivo, `#quote-margin` con sugerido
  `max(250, 15% del base)` y envío `items[] + margin` en el POST; la tabla
  `quotes.items` (JSON) guarda las líneas y `QuoteDetail` muestra la card
  "Servicios cotizados" (incluye el detalle en el mensaje de WhatsApp).
- **Precio compartido `src/shared/pricing.ts`**: `calculateFinalPrice(base, margin?)`
  con fallback legacy exacto (compat con b13: sin margen explícito →
  `base + max(250, 15%)`), `calculateSuggestedMargin`, `isValidMargin`,
  `MARGIN_MIN_MESSAGE` reutilizado por UI y server; PriceBreakdown ahora recibe
  `{items, basePrice, margin, suggestedMargin, finalPrice}` con fila "Tu margen".
- **Tareas con roles**: UI `canManageTasks = super_admin || gerente` (form agregar y
  botón Eliminar solo para ellos; checkbox siempre visible y aviso literal "Solo el
  CEO y el Gerente General pueden agregar tareas. Podés marcarlas como realizadas."
  para el resto) y server `POST/DELETE /api/tasks` exigen header `X-User-Role`
  gerente/CEO → 403 con ese mensaje; `PUT` (marcar) libre.
- **Ajustes solo CEO**: `/configuracion` envuelta en `ProtectedRoute roles=['super_admin']`
  (otros roles ven "ACCESO RESTRINGIDO"), item AJUSTES del sidebar con `roles` y
  render condicional, botón "Configuración" del menú de perfil solo super_admin y
  `Settings canManage = role === 'super_admin'`.
- **Perfil ampliado** (ProfileModal 464 líneas): campos `#profile-title` (cargo),
  `#profile-phone`, `#profile-bio` (hasta 80/40/300 chars, PUT `/api/team/:id` +
  GET `/api/team` ahora con `title, phone, bio`) y **paleta de 6 acentos**
  (Azul/Verde/Violeta/Ámbar/Rosa/Cian) que aplica `data-accent` al montar
  (`--color-primary` en globals.css, Button primario y sidebar activo) y persiste
  `nt_prefs.accent`.
- **Notificaciones programadas**: `server/notifications.ts` (`notify`/`notifyRoles`,
  nunca lanza) + eventos en quotes (quote_created/sent/accepted/rejected/paid/
  reassigned/deleted), services (service_created/changed) y endpoints
  `GET /api/notifications`, `/unread-count`, `PUT /read-all`; AppLayout con polling
  15s (baseline sin beep + `visibilitychange`), `utils/sound.ts` con 4 tonos
  (classic/soft/urgent/chime) y tono configurable `#settings-sound-tone` en Ajustes,
  bloque "Mis notificaciones" (`#settings-notif-clear`) y página Notificaciones con
  "Marcar todas como leídas" (`#notif-mark-all`) + 7 estilos nuevos.

### Fixed
- **CRÍTICO — margen de $250 USD ya no se suma como valor fijo**: el margen es un
  piso configurable, no un aditivo. Server `POST /api/quotes` valida
  `margin < 250 → 400` con `MARGIN_MIN_MESSAGE` (sin `items[]` mantiene la ruta
  legacy byte a byte para compatibilidad con `verify-b13`), la UI muestra "Mínimo
  sugerido: $250 USD", el input `#quote-margin` valida y muestra "El margen mínimo
  es de $250 USD", y `finalPrice = basePrice + margin` consistente en UI, server e
  `ipc.ts` (`finalPrice - basePrice`).

### E2E
- Suite completa tras build (setup 80.6 MB, ASAR 40.8 MB): probe nuevo
  `verify-b25` **37/37** (multi-servicio suma 450=150+300, fila "Tu margen",
  sugerido 250, margen 100 → mensaje, submit con items[] → final 700, tonos,
  perfil campos+acentos, gerente sin Ajustes/`#/configuracion` bloqueada/form tareas
  visible, vendedor sin form+aviso+checkbox+403 server, 0 excepciones),
  `verify-b13` **78/78**, `verify-settings-new` **24/24** (toggles ahora invariantes
  al estado inicial), `verify-c/d/b2/v5` exit 0, server probe `verify-b25-server`
  **26/26**, 0 excepciones/0 console errors.
- Builder: intentos 1-2 `spawn UNKNOWN` en wine → intento 3 exit 0; **NSIS bloqueado
  por Control de aplicaciones** → fallback `robocopy /MIR win-unpacked` (ASAR
  verificado) + atajo recreado; seed de data demo restaurado (8 quotes con estados
  variados); credenciales de prueba gerente/vendedor habilitadas y **restauradas al
  estado seed** (`has_credentials=false`) al cerrar; `login_attempts` limpio.
- Capturas verificadas: `b25-nueva-cotizacion-{servicios,seleccion}.png` (6 servicios
  BD, 2 seleccionados, Tu margen), `b25-perfil-personalizacion.png` (campos Cargo/
  Teléfono/Biografía), `b25-gerente-ajustes-bloqueado.png` y `b25-vendedor-tareas.png`
  (ACCESO RESTRINGIDO sin Ajustes en el sidebar).

## [1.0.0-build24] - 2026-10-02

### Added
- **Ajustes recreado con más funciones** (tabs Cuenta/Empresa/Correos intactas,
  sin "resumen", 1278 líneas): hero "Mi perfil" con avatar/badges y "EDITAR PERFIL"
  (ProfileModal), **Actividad de accesos** real (`GET /api/auth/access-log?identifiers=`,
  fechas ISO → `es-ES` + hora local, filas OK/FALLÓ en verde/rojo), **Copia de
  seguridad** (EXPORTAR/IMPORTAR AJUSTES JSON con descarga real vía Blob y file
  picker que mergea `nt_prefs` completo), **Vista previa de cotización** reactiva
  en Empresa (mock con iniciales del logo), **Estado del correo** en Correos
  (badge Encendido/Apagado + host/puerto/remitente + resultado `nt_mail_test`),
  Preferencias extendidas: "Alertas del sistema" + **PROBAR ALERTA**
  (`new Notification`), Sonido + **PROBAR SONIDO** (WebAudio 880Hz), y selector
  **Formato de fecha en Inicio** (`#settings-date-format`, default `es-ES`)
  consumido por Inicio/Cotizaciones recientes (`readDateFormat`/`formatQuoteDate`).
- **AppLayout**: beep WebAudio + notificación de escritorio al incrementar
  notificaciones no leídas según `nt_prefs.sound/notifyDesktop` (default off →
  comportamiento previo intacto).
- `GET /api/auth/access-log` en `server/routes/auth.ts`; identificadores en
  minúsculas (email de login con clave, código de login con PIN) para que coincidan
  con lo que guarda `login_attempts` en el lockout.

### Changed
- UI oscura: superficies `#0C1E36`, bordes `#16294A`, espaciado `py-4`, selectores
  y botones en línea con el tema; contratos literales preservados
  (`ACTUALIZAR CREDENCIALES`, `GUARDAR CAMBIOS`, `ENVIAR CORREO DE PRUEBA`,
  `SUBIR LOGO`, `Quitar logo`, etc.).

### E2E
- Suite tras instalación NSIS (ASAR 15:41, intento 3 — builder 2 fallos previos:
  timeout 600s y `spawn UNKNOWN` en wine, resuelto corriendo `npx electron-builder`
  directo): **6/6** — `verify-b13` **78/78** (+5.7 accesos, +5.8 formato fecha),
  `verify-settings-new` **24/24** (nuevo: tabs, hero, actividad, backup, preview,
  estado correo, alertas/sonido/fecha), `verify-c/d/b2/v5` exit 0, 0 excepciones.
- Capturas `b24-ajustes-{cuenta,empresa,correos}.png` + scroll Preferencias
  verificadas visualmente (tab activa `#1877E8` confirmada por píxeles).

## [1.0.0-build23] - 2026-10-01

### Fixed
- **Inicio — "Cotizaciones recientes" ya no amontonado**: el número (`#001` se cortaba
  en `#00` por columna `w-9`) y los nombres de cliente salían truncados
  (`Panaderí…`, `Gimnasi…`). Cambios: grid del widget `xl:grid-cols-5` (card 40%) →
  `xl:grid-cols-2` (card 50% ≈ 491px), columna N° `w-9`→`w-12` con
  `whitespace-nowrap`, TOTAL `w-24`→`w-20`, ESTADO `pl-3`→`pl-2`, CLIENTE sin
  `pr-3` (gana el ancho real), filas `py-3.5`→`py-4` y header `pb-4` para más aire.
  Verificado con métricas (0 cortes en N° y cliente, 5/5 filas) y captura
  `b23-widget-full.png`.

### Changed
- **Ventas por mes**: ocupa la mitad derecha simétrica (`col-span-3`→columna natural
  del grid 50/50); el SVG `viewBox` escala sin cambios.

### E2E
- Suite completa tras instalación NSIS (ASAR 16:26, intento 2): **5/5** —
  `verify-b13` **76/76**, `verify-c/d/b2/v5` exit 0, 0 excepciones/0 console errors;
  probe nuevo `check-widget` 5/5 (login, widget, tabla, N° sin cortar, nombres sin
  truncar).

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
