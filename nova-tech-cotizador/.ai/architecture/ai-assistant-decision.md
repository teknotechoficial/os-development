# Decisión: Asistente IA "Nova IA" (build31)

- **Fecha**: 2026-10-04 · **Estado**: Aprobada
- **Alcance**: build31 (núcleo), build32 (acciones), build33 (envíos)

## Contexto

El cotizador necesita un asistente integrado para dudas, búsqueda y
acciones rápidas. La empresa (TeknoTech Services) provee la identidad
de la IA.

## Decisiones

1. **Motor**: proveedor compatible con OpenAI (URL base + clave + modelo
   configurables por el CEO) con **modo local de respaldo** sin clave
   (respuestas deterministas). Justificación: flexibilidad
   (OpenAI/Groq/DeepSeek/endpoint propio), cero dependencias de SDK
   (fetch nativo), la app nunca queda sin asistencia.
2. **Identidad**: "Nova IA", cachorro mascota, avatar
   `src/renderer/assets/nova-ia.png`.
3. **UI**: widget flotante arrastrable (Pointer Events, posición
   persistida en `nova_assistant_pos`) montado en AppLayout; panel de
   chat `#nova-panel`; animaciones CSS propias
   (mascot-idle/thinking/hop) con soporte `prefers-reduced-motion`.
4. **Datos**: columnas `ai_*` en settings + tabla `ai_messages`
   (historial por usuario). La clave API **nunca** se expone en
   `GET /api/settings/public`.
5. **API**: `POST /api/assistant/chat` (rate limit 20/min, mensajes
   1..2000 chars), `GET/DELETE /api/assistant/history`,
   `POST /api/assistant/test` (solo customizers).
6. **Seguridad**: identidad por header `x-user-id` + usuario activo
   (mismo patrón que authorizeCustomization); SQL parametrizado; sin
   streaming en build31 (JSON simple; SSE queda para build33).

## Puntos de integración

- Montaje del widget: `AppLayout` (renderer).
- Avatar de la mascota: `src/renderer/assets/nova-ia.png`.
- Clave de posición persistida: `nova_assistant_pos`.
- Panel de chat en el DOM: `#nova-panel`.
- Persistencia: columnas `ai_*` en settings y tabla `ai_messages`.
- Endpoints: `/api/assistant/chat`, `/api/assistant/history`,
  `/api/assistant/test`.

## Alcance por build

- **build31 (núcleo)**: motor compatible OpenAI configurable + modo
  local de respaldo, widget y panel de chat, columnas `ai_*` y tabla
  `ai_messages`, endpoints de chat, historial y test.
- **build32 (acciones)**: tool-calling para navegar, crear cotización
  y cambiar estados, con permisos por rol.
- **build33 (envíos)**: email de cotización desde el chat y streaming
  (SSE) de las respuestas.

## Consecuencias

- Sin clave API: modo local limitado a orientación/navegación.
- El proveedor externo ve el contenido del chat cuando hay clave
  (advertir en README).
- Build32 añadirá tool-calling (navegar, crear cotización, estados)
  con permisos por rol; build33 email de cotización + streaming.

## Alternativas descartadas

- Ollama local: requiere instalación y modelos en el equipo.
- Solo modo offline: no satisface "IA conversacional".
- SDK oficial OpenAI: dependencia innecesaria dado el modo compatible.

## Limitaciones conocidas (build31)

- **Identidad por header `x-user-id`**: como en todo el sistema, la
  identidad no está firmada (sin JWT/sesión server-side). Un atacante
  con acceso local podría suplantar usuarios. Riesgo preexistente del
  proyecto; se recomienda un token firmado como tarea de seguridad
  transversal.
- **`GET /api/settings` ahora exige `x-user-id`** (guard
  `authorizeCustomization`) — desde build31 la clave API y el SMTP no
  se exponen a llamadas anónimas; el renderer (Settings/BackupCard)
  envía el header.
- **SSRF residual en `POST /api/assistant/test`**: la URL base es
  controlada por el customizador (rol de confianza); no hay bloqueo de
  IPs internas. Añadir allowlist si se expone a más roles.
- **Sin streaming (SSE) en build31**: las respuestas llegan completas;
  queda para build33.
- **Clave API en texto plano en DB**, igual que `smtp_pass` (postura
  existente del proyecto).
