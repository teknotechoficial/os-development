const FALLBACK =
  "Estoy en modo local (sin IA externa configurada). Puedo orientarte sobre el cotizador: ¿querés que te explique cómo crear una cotización, ver reportes o configurar el sistema?";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAny(message: string, words: string[]): boolean {
  return words.some((word) => message.includes(word));
}

function greetingReply(): string {
  return (
    "¡Hola! Soy Nova IA, la asistente del cotizador, y hoy estoy en modo local porque " +
    "todavía no hay una clave API configurada. Aun así puedo ayudarte: te oriento por la app, " +
    "te explico cómo armar cotizaciones, ver reportes, cargar servicios o revisar tareas y avisos. " +
    "Contame qué necesitás y arrancamos."
  );
}

function quoteStepsReply(): string {
  return (
    "Para crear una cotización: 1) tocá el botón NUEVA COTIZACIÓN o entrá a la ruta /nueva-cotizacion; " +
    "2) elegí los servicios del catálogo; 3) cargá los datos del cliente; 4) el sistema calcula los totales " +
    "aplicando el piso mínimo. Después la guardás y la compartís. Si querés, te detallo cada paso."
  );
}

function reportsReply(): string {
  return (
    "Los reportes están en /reportes: filtrás por 3, 6 o 12 meses, ves ventas, totales y tendencias, " +
    "y exportás todo en CSV. Decime 'ir a reportes' y te oriento con el filtro que necesites."
  );
}

function emailReply(): string {
  return (
    "El correo se configura en /configuracion, pestaña Correos: ahí cargás el SMTP, el puerto, " +
    "el usuario y la contraseña, y usás la prueba de envío para confirmar que llega bien. " +
    "Decime 'ir a configuración' y te marco el camino exacto."
  );
}

function helpReply(): string {
  return (
    "Estas son mis funciones: te respondo dudas sobre el cotizador, te oriento en la navegación y las rutas, " +
    "te explico cómo crear cotizaciones y usar el catálogo, te ayudo con reportes y exportaciones, " +
    "te sigo tareas y avisos del equipo, y te apoyo con la configuración del sistema. Decime qué te interesa."
  );
}

function iaKeyReply(): string {
  return (
    "El proveedor, el modelo y la clave de la IA los configura el CEO en Configuración → Sistema → " +
    "tarjeta 'Asistente IA (Nova IA)'. Mientras no haya una clave cargada, sigo respondiéndote en modo local, " +
    "con respuestas armadas en el propio sistema. En cuanto se configure, paso a IA externa."
  );
}

const ROUTE_TABLE: Array<{ keys: string[]; path: string; label: string }> = [
  { keys: ["cotizaciones", "cotizacion"], path: "/cotizaciones", label: "cotizaciones" },
  { keys: ["servicios"], path: "/servicios", label: "servicios" },
  { keys: ["equipo"], path: "/equipo", label: "equipo" },
  { keys: ["historial"], path: "/historial", label: "historial" },
  { keys: ["configuracion", "ajustes"], path: "/configuracion", label: "configuración" },
  { keys: ["dashboard", "inicio"], path: "/dashboard", label: "inicio" },
  { keys: ["notificaciones"], path: "/notificaciones", label: "notificaciones" },
  { keys: ["reportes", "reporte", "estadisticas"], path: "/reportes", label: "reportes" },
];

function routeReply(message: string): string | null {
  for (const route of ROUTE_TABLE) {
    const found = route.keys.some((key) => hasWord(message, key));
    if (found) {
      return (
        `Esa pantalla está en la ruta ${route.path}. ` +
        `Decime 'ir a ${route.label}' y te oriento.`
      );
    }
  }
  return null;
}

function hasWord(message: string, word: string): boolean {
  return new RegExp(`(^|[^a-z0-9])${word}($|[^a-z0-9])`).test(message);
}

export function offlineReply(message: string): string {
  const text = normalize(message || "");

  if (hasWord(text, "hola") || hasWord(text, "buenas") || hasWord(text, "buenos") || hasWord(text, "hey")) {
    return greetingReply();
  }

  const wantsQuote =
    hasWord(text, "cotizacion") || hasWord(text, "cotizaciones");
  if (hasWord(text, "como") && (hasWord(text, "crear") || hasWord(text, "hacer")) && wantsQuote) {
    return quoteStepsReply();
  }

  if (hasAny(text, ["reporte", "ventas", "estadistica"])) {
    return reportsReply();
  }

  if (hasAny(text, ["correo", "email", "smtp"])) {
    return emailReply();
  }

  if (
    hasWord(text, "ayuda") ||
    hasWord(text, "que puedes") ||
    hasWord(text, "que sabes") ||
    hasAny(text, ["funciones", "funcionalidades"])
  ) {
    return helpReply();
  }

  if (
    hasWord(text, "clave") ||
    hasWord(text, "api key") ||
    hasWord(text, "proveedor") ||
    hasWord(text, "configurar ia")
  ) {
    return iaKeyReply();
  }

  const route = routeReply(text);
  if (route) {
    return route;
  }

  return FALLBACK;
}
