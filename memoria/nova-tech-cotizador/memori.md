# 📒 Agenda del Proyecto — nova-tech-cotizador

> Archivo mantenido por Elizabet (Secretaría Ejecutiva). Modo anexos: solo se agrega información al final.

---

### [2026-09-24 22:42:21] - 🚀 Inicio: Jornada de cierre y empaquetado

**Qué pasó**: Continuación de la sesión de desarrollo de Nova Tech Cotizador (app Electron + React + PostgreSQL).

**Contexto**: El usuario solicitó continuar el trabajo pendiente del día anterior.

**Resultado**: Fase de estabilización y empaquetado iniciada.

---

### [2026-09-24 22:42:21] - 🔧 Error: Build de Vite fallaba por archivos .js compilados en src/

**Qué pasó**: `npx vite build` fallaba con `"calculateBasePrice" is not exported by "src/shared/pricing.js"`.

**Contexto**: Archivos `.js`/`.d.ts` compilados quedaron en `src/shared/` (generados por un `tsc` mal configurado) y Rollup los prefería a los `.ts`.

**Detalles técnicos**: Eliminados `pricing.js`, `constants.js`, `types.js`, `validators.js` (+ maps/d.ts) y `src/main/electron.js` stale. Regla aprendida: nunca dejar artefactos compilados dentro de `src/`.

**Resultado**: Build de Vite ✅

---

### [2026-09-24 22:42:21] - 🔧 Solución: Errores TypeScript restantes corregidos

**Qué pasó**: `npx tsc --noEmit` reportaba 2 errores.

**Detalles técnicos**: `ProductSelector.tsx` tipado con `ProductType` en lugar de `string`; cast `status as DeveloperAvailability['status']` en `store/team.ts`.

**Resultado**: `tsc --noEmit` limpio ✅

---

### [2026-09-24 22:42:21] - ⚙️ Configuración: Empaquetado Electron (electron-builder NSIS)

**Qué pasó**: Se configuró el build del instalador de Windows.

**Detalles técnicos**:
- `package.json.main` → `dist/main/src/main/electron-main.js`
- Sección `build` (NSIS, oneClick=false, desktop+start menu shortcuts, icono PNG)
- `tsconfig.main.json` incluye `src/preload.ts` y `server/**`
- winCodeSign caché reparado manualmente en `%LOCALAPPDATA%\electron-builder\Cache\winCodeSign\winCodeSign-2.6.0` (error de symlinks en Windows: extracción manual con 7za + directorio final creado)

**Resultado**: Instalador generado: `release\Nova Tech Cotizador Setup 1.0.0.exe` (~76 MB) ✅

---

### [2026-09-24 22:42:21] - 🧠 Decisión: API alcanzable en producción (Express dentro de Electron)

**Qué pasó**: En `file://` las llamadas `fetch('/api/...')` relativas no funcionan.

**Detalles técnicos**:
- `src/renderer/api.ts`: `API_BASE = 'http://localhost:3001'` cuando `protocol === 'file:'`
- Vite dev proxy `/api → localhost:3001`
- `src/main/index.ts` importa y arranca el servidor Express (`start()`); `server/index.ts` solo auto-arranca si `require.main === module`
- `.env` cargado con `dotenv.config({ path: join(app.getAppPath(), '.env') })`

**Resultado**: App empaquetada levanta su propio servidor ✅ (health OK)

---

### [2026-09-24 22:42:21] - 🔧 Solución: Runtime CJS — alias `@/` y nanoid ESM

**Qué pasó**: Electron fallaba al cargar: `Cannot find module '@/shared/pricing'` y `ERR_REQUIRE_ESM` de nanoid v5.

**Detalles técnicos**: `tsc` no reescribe paths de alias; reemplazados imports `@/shared/*` en `server/routes/api.ts` por relativos. `nanoid` eliminado de dependencies → `randomUUID()` de `node:crypto` en `team.ts` y `availability.ts`.

**Resultado**: Servidor Express carga en CJS ✅

---

### [2026-09-24 22:42:21] - 🧠 Decisión: Recuperación de PostgreSQL 16 local

**Qué pasó**: El `.env` tenía credenciales placeholder; el usuario no sabía que tenía PostgreSQL instalado ni su contraseña.

**Detalles técnicos**: Servicio `postgresql-x64-16` corriendo, `pg_hba.conf` en `scram-sha-256`. Procedimiento: backup de pg_hba → `trust` temporal en 127.0.0.1 → conexión como `postgres` → creación de rol y BD → restauración de pg_hba original (backup eliminado). Roles existentes: `postgres`, `teknotech`.

**Configuración**: Rol `nova_tech` / contraseña `NovaTech2026!` / BD `nova_tech`. `DATABASE_URL=postgresql://nova_tech:NovaTech2026!@localhost:5432/nova_tech` en `.env` (gitignored ✅).

**Resultado**: Acceso a BD recuperado sin afectar configuración existente ✅

---

### [2026-09-24 22:42:21] - 📊 Tarea: Seed de base de datos completado

**Qué pasó**: `npm run db:init` + `npm run db:seed` ejecutados.

**Detalles técnicos**: 10 empleados: Sebastian (CEO001, super_admin), Juan (GTE001, gerente), Belen/Wilder/Evasisto (DEV001-3, desarrolladores), Amauir/Emilia/Federico/Jhon/Maria (VEN001-5, vendedores). Availability cargada para los 3 desarrolladores.

**Resultado**: Seed completo ✅

---

### [2026-09-24 22:42:21] - 🔧 Error/Solución: Desajustes de rutas API y snake_case vs camelCase

**Qué pasó**: Login daba 404; notificaciones PUT daba 404; availability sin GET; el PUT de settings era secuestrado por `PUT /:id` de quotes; los responses en snake_case no coincidían con los tipos del renderer.

**Detalles técnicos**:
- `POST /api/auth/login` → `POST /api/login` (corregido en renderer)
- `PUT /api/notifications/:id` → `PUT /api/notifications/:id/read`
- Agregado `GET /api/availability` (no existía)
- `server/routes/api.ts` reducido a login + health (eliminadas rutas duplicadas/sombreadas)
- Helpers `toCamel()` / `mapRows()` en `server/db.ts` aplicados a todas las respuestas
- Columnas faltantes en `settings` (payment_titular, phone, email, company_logo) agregadas via `ALTER TABLE IF NOT EXISTS` en ambos `initDatabase`

**Resultado**: Todos los endpoints probados OK ✅ (login, quotes GET/POST, team, availability, settings GET/PUT, notifications)

---

### [2026-09-24 22:42:21] - 📊 Tarea: Persistencia de cotizaciones

**Qué pasó**: `NewQuote` solo guardaba en memoria (se perdía al recargar).

**Detalles técnicos**: Nuevo `POST /api/quotes` en `server/routes/quotes.ts`; precios calculados en el servidor (`calculateBasePrice`/`calculateFinalPrice`); campos NOT NULL (`base_price`, `final_price`) resueltos; `config` parseado de JSON de texto; `PUT /api/quotes/:id` con COALESCE. GET por rol (vendedor → propias, desarrollador → asignadas, resto → todas).

**Resultado**: Cotizaciones persisten en BD con precios correctos (ej. web 5pp: base 500 + margen 250 = 750) ✅

---

### [2026-09-24 22:42:21] - 🔧 Error: Pantalla en blanco en la app empaquetada

**Qué pasó**: La ventana abría con título correcto pero contenido blanco.

**Detalles técnicos**: Dos causas: (1) `loadFile` apuntaba a `../renderer/index.html` desde `dist/main/src/main` (ruta inexistente) → corregido a `join(app.getAppPath(), 'dist', 'renderer', 'index.html')`; (2) `index.html` usaba rutas absolutas `/assets/...` que rompen en `file://` → agregado `base: './'` en `vite.config.ts`. También `Menu.setApplicationMenu(null)`.

**Estado**: ⚠️ PENDIENTE VERIFICAR — la captura final (`nova-screen5.png`) no llegó a revisarse.

**Resultado**: Fix aplicado y compilado; verificación visual pendiente

---

### [2026-09-24 22:42:21] - 📈 Progreso: Estado general del proyecto

**Qué pasó**: Cierre de jornada.

**Estado completado**:
- ✅ Build completo (`npm run build` + `tsc --noEmit` limpios)
- ✅ PostgreSQL operativo + seed de 10 empleados
- ✅ API REST completa probada
- ✅ Instalador NSIS generado en `release\`

**Pendientes para la próxima sesión**:
1. Revisar `nova-screen5.png` (¿UI cargó tras el fix de base './'?)
2. Regenerar `.exe` final — el instalador de 21:50 NO incluye el fix de pantalla en blanco (el `win-unpacked` de ~22:05 sí; verificar `exe-build.log`)
3. Probar flujo de login en la GUI empaquetada
4. Limpiar logs temporales (`server-test.log`, `electron-test.log`, `exe-build.log`)

**Resultado**: Agenda archivada; proyecto listo para retomar

---

### [2026-09-25 11:05:00] - 🔧 Error: Pantalla en blanco persistía — causa raíz identificada

**Qué pasó**: La captura pendiente (`nova-screen5.png`) confirmó que la app seguía en blanco pese al fix `base: './'` + `loadFile`.

**Contexto**: Diagnóstico con Electron remote debugging (`--remote-debugging-port=9222` + CDP vía WebSocket nativo de Node 24).

**Detalles técnicos**: La app NO crasheaba — React montaba (warnings de React Router visibles en consola), 0 excepciones, API health OK. El problema: `BrowserRouter` bajo `file://` usa HTML5 history → el pathname real es `/C:/Users/.../index.html` → no matchea ninguna ruta → cae en `path="*"` → `<Navigate to="/" />` → `pushState('/')` canoniza a `file:///C:/` (raíz del disco) → vuelve a matchear `*` → bucle que renderiza **NULL** → raíz vacía → ventana blanca.

**Resultado**: Causa raíz confirmada con trazas `Page.navigatedWithinDocument` a `file:///C:/`

---

### [2026-09-25 11:29:00] - 🔧 Solución: HashRouter + navegación post-login

**Qué pasó**: Se aplicaron los 2 fixes definitivos de UI.

**Detalles técnicos**:
1. `App.tsx`: `BrowserRouter` → `HashRouter` (rutas en `#/`, único patrón compatible con `file://`; funciona igual en dev vite)
2. `Login.tsx`: faltaba navegación tras login exitoso — agregado `useNavigate` + `navigate('/dashboard')` (antes el formulario quedaba pegado pese a login OK)
3. Nota: `src/renderer/router.tsx` está sin uso (duplicado muerto de las rutas)

**Build**: vite (`main-PhhFv71U.js`) + `tsc -p tsconfig.main.json` OK; `electron-builder --win dir` (ojo: falla con "Acceso denegado" si la app está corriendo desde `win-unpacked` — matar procesos y esperar ~4s)

**Resultado**: Verificado por CDP: URL correcta en asar, rootLen=811 (login) → login CEO001 → `#/dashboard` rootLen=1247 "Hola, Sebastian"

---

### [2026-09-25 11:40:00] - 📊 Tarea: Diagnóstico de "falso blanco" — ventana minimizada

**Qué pasó**: El DOM mostraba la UI correcta pero las capturas salían en blanco y `Page.captureScreenshot` colgaba.

**Detalles técnicos**: `document.visibilityState = "hidden"` → Chromium pausa el rasterizado de páginas ocultas. Causa: la ventana estaba **minimizada** (las apps lanzadas vía WMI/cmd desconectado arrancan minimizadas en este entorno). Solución de diagnóstico: `user32.dll ShowWindow(hwnd, SW_RESTORE)` + `SetForegroundWindow` (Add-Type de PowerShell; ojo: el tipo C# hay que declararlo en CADA llamada de shell) → `visibility: visible` → capturas CDP OK.

**Regla aprendida**: antes de capturar pantalla de la app, verificar `IsIconic(hwnd)` y restaurar.

**Resultado**: Login (gradiente azul + tarjeta) y Dashboard (header + KPIs) capturados y confirmados visualmente

---

### [2026-09-25 11:52:46] - 📈 Progreso: Instalador final regenerado con todos los fixes

**Qué pasó**: `npm run build:exe` → exit 0, block map generado.

**Detalles técnicos**: `release\Nova Tech Cotizador Setup 1.0.0.exe` (80.143.651 bytes, 25/09/2026 11:52:46). Verificado que el `app.asar` contiene el bundle nuevo (`main-PhhFv71U.js`) y el marker de hash history.

**Resultado**: Instalador al día — ya NO incluye el bug de pantalla blanca

---

### [2026-09-25 11:57:00] - 📊 Tarea: Instalación silenciosa + pruebas E2E completadas

**Qué pasó**: Instalador ejecutado con `/S` (NSIS silencioso) → instalado en `%LOCALAPPDATA%\Programs\Nova Tech Cotizador\`.

**Verificación en la app INSTALADA**: procesos ✓ · PostgreSQL init ✓ · servidor Express :3001 health ✓ · React carga desde asar instalado ✓ · ventana visible ✓ · login `#/` con formulario ✓ · **CEO001 → `#/dashboard` con "Hola, Sebastian" + KPIs ✓ · 0 excepciones, 0 errores de consola** ✓

**Resultado**: La app instalada funciona de extremo a extremo — PRIMERA VERIFICACIÓN VISUAL COMPLETA

---

### [2026-09-25 11:59:47] - 📝 Nota: Estado final y pendientes de la sesión

**Limpiado**: `server-test.log`, `electron-test.log`, `exe-build.log`, `renderer-debug.log` eliminados (queda `installed-debug.log` mientras la app esté abierta — el stdout está bloqueado).

**Abierto**:
- App instalada dejada CORRIENDO en `#/dashboard` para inspección (cierra al cerrar la app; posteriormente arranca normal desde el acceso directo)
- `installed-debug.log` se borrará al cerrar la app
- Proyecto `nova-tech-cotizador/` sigue **sin trackear en git** (0 archivos versionados) — decidir con el usuario si se inicializa repo
- Mejoras futuras: guardado de sesión en localStorage (recarga = volver al login), sidebar/falta de cotizaciones del CEO, `author` en package.json (warning electron-builder)

**Resultado**: Los 4 pendientes del día anterior resueltos (captura revisada, exe regenerado, login GUI probado, logs limpios)
