import { Router } from 'express';
import { getPool, toCamel } from '../db';
import { createMailTransport, mailFrom } from '../auth-helpers';

const router = Router();

const CURRENCY_CODES = ['USD', 'EUR', 'ARS', 'GBP'];
const DEFAULT_TEAM_ROLES = ['gerente', 'vendedor', 'closer', 'desarrollador'];
const THEME_CODES = ['dark', 'midnight', 'steel', 'ocean'];
const NAV_PATHS = [
  '/dashboard',
  '/reportes',
  '/cotizaciones',
  '/nueva-cotizacion',
  '/servicios',
  '/equipo',
  '/historial',
  '/mi-trabajo',
  '/configuracion',
];

const clampInt = (value: any, min: number, max: number): number | null => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const i = Math.round(n);
  return i >= min && i <= max ? i : null;
};

/* Nav arrays: known routes only, no duplicates, max 30 entries */
const parseNavArray = (value: any): string[] | null => {
  if (!Array.isArray(value) || value.length > 30) return null;
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || !NAV_PATHS.includes(item)) return null;
    if (!out.includes(item)) out.push(item);
  }
  return out;
};

const parseNavJson = (raw: any): string[] => {
  if (typeof raw !== 'string' || !raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string' && NAV_PATHS.includes(x)) : [];
  } catch {
    return [];
  }
};

/* Custom sidebar labels: { '/path': 'Label' } - known routes only */
const parseLabelsJson = (raw: any): Record<string, string> => {
  if (typeof raw !== 'string' || !raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (NAV_PATHS.includes(k) && typeof v === 'string' && v.trim() && v.length <= 40) {
        out[k] = v.trim();
      }
    }
    return out;
  } catch {
    return {};
  }
};

const parseLabelsInput = (value: any): Record<string, string> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const entries = Object.entries(value);
  if (entries.length > NAV_PATHS.length) return null;
  const out: Record<string, string> = {};
  for (const [k, v] of entries) {
    if (!NAV_PATHS.includes(k)) return null;
    if (typeof v !== 'string') return null;
    /* empty string = clear the custom label (falls back to the default) */
    if (!v.trim()) continue;
    if (v.length > 40) return null;
    out[k] = v.trim();
  }
  return out;
};

const parseLogJson = (raw: any): any[] => {
  if (typeof raw !== 'string' || !raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 20) : [];
  } catch {
    return [];
  }
};

/* Custom themes: user-created palettes. Each theme rewrites the six base layer
   colors plus accent/text colors via runtime-injected [data-theme] CSS. */
const THEME_SLOTS = ['bg', 'deep', 'surface', 'card', 'borderSoft', 'border', 'accent', 'accentText', 'text', 'textMuted', 'textDim'];
const HEX_RE = /^#[0-9A-Fa-f]{6}$/;
const THEME_ID_RE = /^[a-z0-9][a-z0-9-]{2,31}$/;

const parseCustomThemesInput = (value: any): any[] | null => {
  if (!Array.isArray(value) || value.length > 30) return null;
  const ids = new Set<string>();
  const out: any[] = [];
  for (const t of value) {
    if (!t || typeof t !== 'object' || Array.isArray(t)) return null;
    const { id, name, colors } = t as any;
    if (typeof id !== 'string' || !THEME_ID_RE.test(id) || THEME_CODES.includes(id) || ids.has(id)) return null;
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 40) return null;
    if (!colors || typeof colors !== 'object' || Array.isArray(colors)) return null;
    const c: Record<string, string> = {};
    for (const slot of THEME_SLOTS) {
      const v = (colors as any)[slot];
      if (typeof v !== 'string' || !HEX_RE.test(v)) return null;
      c[slot] = v;
    }
    ids.add(id);
    out.push({ id, name: name.trim(), colors: c });
  }
  return out;
};

const parseCustomThemesJson = (raw: any): any[] => {
  if (typeof raw !== 'string' || !raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return parseCustomThemesInput(parsed) ?? [];
  } catch {
    return [];
  }
};

/* Settings mutations require an identified active user with the CEO role or
   the explicit can_customize_ui permission granted by the CEO */
type Authz = { ok: true; actorId: string; actorName: string } | { ok: false; status: number; error: string };
const authorizeCustomization = async (req: any): Promise<Authz> => {
  const actorId = req.headers['x-user-id'];
  if (!actorId || typeof actorId !== 'string') {
    return { ok: false, status: 401, error: 'Identidad no proporcionada' };
  }
  const db = getPool();
  const r = await db.query('SELECT name, role, is_active, can_customize_ui FROM users WHERE id = $1', [actorId]);
  const u = r.rows[0];
  if (!u || !u.is_active) return { ok: false, status: 401, error: 'Usuario no válido' };
  if (u.role !== 'super_admin' && !u.can_customize_ui) {
    return { ok: false, status: 403, error: 'Permisos insuficientes para personalizar la aplicación' };
  }
  return { ok: true, actorId, actorName: u.name || '' };
};

router.get('/', async (_req: any, res: any) => {
  const db = getPool();
  try {
    const s = await db.query("SELECT * FROM settings WHERE id = 'app'");
    const row = s.rows[0] ? toCamel(s.rows[0]) : null;
    if (row) {
      row.sidebarOrder = parseNavJson((row as any).sidebarOrder);
      row.sidebarHidden = parseNavJson((row as any).sidebarHidden);
      row.sidebarLabels = parseLabelsJson((row as any).sidebarLabels);
      row.customLog = parseLogJson((row as any).customLog);
      row.customThemes = parseCustomThemesJson((row as any).customThemes);
    }
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: 'Error en servidor' });
  }
});

/* Public settings for every client (no SMTP secrets): sidebar name, display
   currency, notification polling interval, sale minimum and team defaults */
router.get('/public', async (_req: any, res: any) => {
  const db = getPool();
  try {
    const s = await db.query(
      `SELECT company_name, company_logo, currency, notif_interval, margin_minimum,
              team_default_role, team_default_title, phone, email, payment_alias, payment_titular,
              theme, sidebar_order, sidebar_hidden, login_tagline, sidebar_labels, app_icon,
              app_title_suffix, custom_version, custom_themes
       FROM settings WHERE id = 'app'`
    );
    const row = s.rows[0] ? toCamel(s.rows[0]) : null;
    if (row) {
      row.sidebarOrder = parseNavJson((row as any).sidebarOrder);
      row.sidebarHidden = parseNavJson((row as any).sidebarHidden);
      row.sidebarLabels = parseLabelsJson((row as any).sidebarLabels);
      row.customThemes = parseCustomThemesJson((row as any).customThemes);
    }
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: 'Error en servidor' });
  }
});

router.put('/', async (req: any, res: any) => {
  const auth = await authorizeCustomization(req);
  if (!auth.ok) {
    const fail = auth as { ok: false; status: number; error: string };
    return res.status(fail.status).json({ error: fail.error });
  }
  const db = getPool();
  const {
    companyName,
    companyLogo,
    marginMinimum,
    margin,
    paymentAlias,
    paymentTitular,
    phone,
    email,
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPass,
    smtpFrom,
    smtpEnabled,
    currency,
    notifInterval,
    loginMaxAttempts,
    loginLockoutMinutes,
    teamDefaultRole,
    teamDefaultTitle,
    theme,
    sidebarOrder,
    sidebarHidden,
    loginTagline,
    sidebarLabels,
    appIcon,
    appTitleSuffix,
    customThemes,
  } = req.body || {};
  const marginValue = marginMinimum !== undefined ? marginMinimum : margin;
  try {
    if (marginValue !== undefined && marginValue !== null) {
      const m = Number(marginValue);
      if (!Number.isFinite(m) || m < 0 || m > 100000) {
        return res.status(400).json({ error: 'Mínimo de venta inválido' });
      }
    }
    if (currency !== undefined && !CURRENCY_CODES.includes(currency)) {
      return res.status(400).json({ error: 'Moneda no válida' });
    }
    const notifValue =
      notifInterval !== undefined && notifInterval !== null
        ? clampInt(notifInterval, 5, 300)
        : null;
    if (notifInterval !== undefined && notifInterval !== null && notifValue === null) {
      return res.status(400).json({ error: 'Intervalo de notificaciones inválido (5 a 300 s)' });
    }
    const maxAttemptsValue =
      loginMaxAttempts !== undefined && loginMaxAttempts !== null
        ? clampInt(loginMaxAttempts, 3, 20)
        : null;
    if (loginMaxAttempts !== undefined && loginMaxAttempts !== null && maxAttemptsValue === null) {
      return res.status(400).json({ error: 'Intentos de acceso inválidos (3 a 20)' });
    }
    const lockoutValue =
      loginLockoutMinutes !== undefined && loginLockoutMinutes !== null
        ? clampInt(loginLockoutMinutes, 1, 120)
        : null;
    if (loginLockoutMinutes !== undefined && loginLockoutMinutes !== null && lockoutValue === null) {
      return res.status(400).json({ error: 'Bloqueo de acceso inválido (1 a 120 minutos)' });
    }
    if (teamDefaultRole !== undefined && teamDefaultRole !== null && teamDefaultRole !== '') {
      if (!DEFAULT_TEAM_ROLES.includes(teamDefaultRole)) {
        return res.status(400).json({ error: 'Puesto por defecto no válido' });
      }
    }
    let teamTitleValue: string | null = null;
    if (teamDefaultTitle !== undefined && teamDefaultTitle !== null) {
      if (typeof teamDefaultTitle !== 'string' || teamDefaultTitle.length > 80) {
        return res.status(400).json({ error: 'Cargo por defecto demasiado largo' });
      }
      teamTitleValue = teamDefaultTitle.trim();
    }
    let themeValue: string | null = null;
    if (theme !== undefined && theme !== null) {
      if (typeof theme !== 'string' || (!THEME_CODES.includes(theme) && !THEME_ID_RE.test(theme))) {
        return res.status(400).json({ error: 'Tema no válido' });
      }
      themeValue = theme;
    }
    /* custom theme ids are validated against the list being saved (or the
       stored list when customThemes is not part of this payload) */
    if (themeValue && !THEME_CODES.includes(themeValue)) {
      let themeFound = false;
      if (customThemes !== undefined) {
        const candidate = parseCustomThemesInput(customThemes);
        themeFound = candidate !== null && candidate.some((t) => t.id === themeValue);
      }
      if (!themeFound) {
        const cur = await db.query("SELECT custom_themes FROM settings WHERE id = 'app'");
        const stored = parseCustomThemesJson(cur.rows[0]?.custom_themes);
        themeFound = stored.some((t) => t.id === themeValue);
      }
      if (!themeFound) {
        return res.status(400).json({ error: 'Tema personalizado inexistente' });
      }
    }
    let sidebarOrderValue: string | null = null;
    if (sidebarOrder !== undefined && sidebarOrder !== null) {
      const arr = parseNavArray(sidebarOrder);
      if (arr === null) {
        return res.status(400).json({ error: 'Orden del sidebar inválido' });
      }
      sidebarOrderValue = JSON.stringify(arr);
    }
    let sidebarHiddenValue: string | null = null;
    if (sidebarHidden !== undefined && sidebarHidden !== null) {
      const arr = parseNavArray(sidebarHidden);
      if (arr === null) {
        return res.status(400).json({ error: 'Elementos ocultos inválidos' });
      }
      sidebarHiddenValue = JSON.stringify(arr);
    }
    let taglineValue: string | null = null;
    if (loginTagline !== undefined && loginTagline !== null) {
      if (typeof loginTagline !== 'string' || loginTagline.length > 200) {
        return res.status(400).json({ error: 'Texto del login demasiado largo (máx. 200)' });
      }
      taglineValue = loginTagline;
    }
    let sidebarLabelsValue: string | null = null;
    if (sidebarLabels !== undefined && sidebarLabels !== null) {
      const obj = parseLabelsInput(sidebarLabels);
      if (obj === null) {
        return res.status(400).json({ error: 'Etiquetas del menú inválidas' });
      }
      sidebarLabelsValue = JSON.stringify(obj);
    }
    let appIconValue: string | null = null;
    if (appIcon !== undefined && appIcon !== null) {
      const value = typeof appIcon === 'string' ? appIcon : '';
      if (value !== '' && !/^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,/.test(value)) {
        return res.status(400).json({ error: 'Icono no válido' });
      }
      if (value.length > 400000) {
        return res.status(400).json({ error: 'El icono es demasiado grande (máx. 300 KB)' });
      }
      appIconValue = value;
    }
    let titleSuffixValue: string | null = null;
    if (appTitleSuffix !== undefined && appTitleSuffix !== null) {
      if (typeof appTitleSuffix !== 'string' || appTitleSuffix.length > 40) {
        return res.status(400).json({ error: 'Sufijo del título demasiado largo (máx. 40)' });
      }
      titleSuffixValue = appTitleSuffix;
    }
    let customThemesValue: string | null = null;
    if (customThemes !== undefined && customThemes !== null) {
      const parsed = parseCustomThemesInput(customThemes);
      if (parsed === null) {
        return res.status(400).json({ error: 'Temas personalizados inválidos' });
      }
      customThemesValue = JSON.stringify(parsed);
    }
    /* every visual customization bumps the shared version + appends the log so
       all clients can announce "nueva personalización vN" */
    const CUSTOM_FIELDS: [string, any][] = [
      ['companyName', companyName],
      ['companyLogo', companyLogo],
      ['theme', theme],
      ['sidebarOrder', sidebarOrder],
      ['sidebarHidden', sidebarHidden],
      ['sidebarLabels', sidebarLabels],
      ['loginTagline', loginTagline],
      ['appIcon', appIcon],
      ['appTitleSuffix', appTitleSuffix],
      ['customThemes', customThemes],
    ];
    const touchedFields = CUSTOM_FIELDS.filter(([, v]) => v !== undefined).map(([k]) => k);
    let versionValue: number | null = null;
    let logValue: string | null = null;
    if (touchedFields.length > 0) {
      const cur = await db.query("SELECT custom_version, custom_log FROM settings WHERE id = 'app'");
      const prevVersion = Number(cur.rows[0]?.custom_version) || 1;
      const prevLog = parseLogJson(cur.rows[0]?.custom_log);
      const nextVersion = prevVersion + 1;
      const entry = {
        v: nextVersion,
        at: new Date().toISOString(),
        who: auth.ok ? auth.actorName : '',
        fields: touchedFields,
      };
      versionValue = nextVersion;
      logValue = JSON.stringify([entry, ...prevLog].slice(0, 20));
    }
    const result = await db.query(
      `UPDATE settings SET
         company_name = COALESCE($1, company_name),
         company_logo = COALESCE($2, company_logo),
         margin_minimum = COALESCE($3, margin_minimum),
         payment_alias = COALESCE($4, payment_alias),
         payment_titular = COALESCE($5, payment_titular),
         phone = COALESCE($6, phone),
         email = COALESCE($7, email),
         smtp_host = COALESCE($8, smtp_host),
         smtp_port = COALESCE($9, smtp_port),
         smtp_user = COALESCE($10, smtp_user),
         smtp_pass = COALESCE($11, smtp_pass),
         smtp_from = COALESCE($12, smtp_from),
         smtp_enabled = COALESCE($13, smtp_enabled),
         currency = COALESCE($14, currency),
         notif_interval = COALESCE($15, notif_interval),
         login_max_attempts = COALESCE($16, login_max_attempts),
         login_lockout_minutes = COALESCE($17, login_lockout_minutes),
         team_default_role = COALESCE($18, team_default_role),
         team_default_title = COALESCE($19, team_default_title),
         theme = COALESCE($20, theme),
         sidebar_order = COALESCE($21, sidebar_order),
         sidebar_hidden = COALESCE($22, sidebar_hidden),
         login_tagline = COALESCE($23, login_tagline),
         sidebar_labels = COALESCE($24, sidebar_labels),
         app_icon = COALESCE($25, app_icon),
         app_title_suffix = COALESCE($26, app_title_suffix),
         custom_version = COALESCE($27, custom_version),
         custom_log = COALESCE($28, custom_log),
         custom_themes = COALESCE($29, custom_themes),
         updated_at = $30
       WHERE id = 'app'`,
      [
        companyName !== undefined ? companyName : null,
        companyLogo !== undefined ? companyLogo : null,
        marginValue !== undefined && marginValue !== null ? Number(marginValue) : null,
        paymentAlias !== undefined ? paymentAlias : null,
        paymentTitular !== undefined ? paymentTitular : null,
        phone !== undefined ? phone : null,
        email !== undefined ? email : null,
        smtpHost !== undefined ? smtpHost : null,
        smtpPort !== undefined && smtpPort !== null && smtpPort !== '' ? Number(smtpPort) : null,
        smtpUser !== undefined ? smtpUser : null,
        smtpPass !== undefined ? smtpPass : null,
        smtpFrom !== undefined ? smtpFrom : null,
        smtpEnabled !== undefined && smtpEnabled !== null ? !!smtpEnabled : null,
        currency !== undefined ? currency : null,
        notifValue,
        maxAttemptsValue,
        lockoutValue,
        teamDefaultRole !== undefined && teamDefaultRole !== null && teamDefaultRole !== ''
          ? teamDefaultRole
          : null,
        teamTitleValue,
        themeValue,
        sidebarOrderValue,
        sidebarHiddenValue,
        taglineValue,
        sidebarLabelsValue,
        appIconValue,
        titleSuffixValue,
        versionValue,
        logValue,
        customThemesValue,
        new Date().toISOString(),
      ]
    );
    if (result.rowCount === 0) {
      await db.query(
        `INSERT INTO settings (id, company_name, company_logo, margin_minimum, payment_alias,
           payment_titular, phone, email, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from,
           smtp_enabled, currency, notif_interval, login_max_attempts, login_lockout_minutes,
           team_default_role, team_default_title, theme, sidebar_order, sidebar_hidden,
           login_tagline, sidebar_labels, app_icon, app_title_suffix, custom_version, custom_log, custom_themes, updated_at)
         VALUES ('app', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)
         ON CONFLICT (id) DO NOTHING`,
        [
          companyName || 'TeknoTech Services',
          companyLogo !== undefined ? companyLogo : null,
          marginValue !== undefined && marginValue !== null ? Number(marginValue) : 250,
          paymentAlias || 'belo.arg.usd',
          paymentTitular || 'TeknoTech Services',
          phone || '',
          email || '',
          smtpHost || '',
          smtpPort !== undefined && smtpPort !== null && smtpPort !== '' ? Number(smtpPort) : 465,
          smtpUser || '',
          smtpPass || '',
          smtpFrom || '',
          smtpEnabled !== undefined && smtpEnabled !== null ? !!smtpEnabled : false,
          currency && CURRENCY_CODES.includes(currency) ? currency : 'USD',
          notifValue ?? 15,
          maxAttemptsValue ?? 5,
          lockoutValue ?? 15,
          teamDefaultRole || 'vendedor',
          teamTitleValue || '',
          themeValue || 'dark',
          sidebarOrderValue || '[]',
          sidebarHiddenValue || '[]',
          taglineValue || 'Tecnología que impulsa,|lealtad que permanece.',
          sidebarLabelsValue || '{}',
          appIconValue || '',
          titleSuffixValue ?? 'Cotizador',
          versionValue ?? 1,
          logValue || '[]',
          customThemesValue || '[]',
          new Date().toISOString(),
        ]
      );
    }
    const s = await db.query("SELECT * FROM settings WHERE id = 'app'");
    res.json({ success: true, settings: s.rows[0] ? toCamel(s.rows[0]) : null });
  } catch (err) {
    console.error('[settings PUT]', err);
    res.status(500).json({ error: 'Error al guardar' });
  }
});

// POST /api/settings/test-mail
router.post('/test-mail', async (req: any, res: any) => {
  const auth = await authorizeCustomization(req);
  if (!auth.ok) {
    const fail = auth as { ok: false; status: number; error: string };
    return res.status(fail.status).json({ error: fail.error });
  }
  const db = getPool();
  try {
    const s = await db.query("SELECT * FROM settings WHERE id = 'app'");
    const st = s.rows[0];
    if (!st || !st.smtp_enabled) {
      return res.status(400).json({ error: 'SMTP no configurado' });
    }
    const smtp = {
      smtpHost: st.smtp_host || '',
      smtpPort: Number(st.smtp_port) || 465,
      smtpUser: st.smtp_user || '',
      smtpPass: st.smtp_pass || '',
      smtpFrom: st.smtp_from || '',
      smtpEnabled: true,
    };
    const transport = createMailTransport(smtp);
    const appName = (st.company_name || 'TeknoTech Services') + (st.app_title_suffix ? ` ${st.app_title_suffix}` : '');
    await transport.sendMail({
      from: mailFrom(smtp),
      to: smtp.smtpUser,
      subject: `Prueba SMTP - ${appName}`,
      text: 'Configuración correcta.',
    });
    return res.json({ success: true });
  } catch (err) {
    console.error('[settings test-mail]', err);
    const msg = err instanceof Error && err.message ? err.message : 'Error al enviar el correo de prueba';
    return res.status(500).json({ error: msg });
  }
});

export default router;
