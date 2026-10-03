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

router.get('/', async (_req: any, res: any) => {
  const db = getPool();
  try {
    const s = await db.query("SELECT * FROM settings WHERE id = 'app'");
    const row = s.rows[0] ? toCamel(s.rows[0]) : null;
    if (row) {
      row.sidebarOrder = parseNavJson((row as any).sidebarOrder);
      row.sidebarHidden = parseNavJson((row as any).sidebarHidden);
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
              theme, sidebar_order, sidebar_hidden, login_tagline
       FROM settings WHERE id = 'app'`
    );
    const row = s.rows[0] ? toCamel(s.rows[0]) : null;
    if (row) {
      row.sidebarOrder = parseNavJson((row as any).sidebarOrder);
      row.sidebarHidden = parseNavJson((row as any).sidebarHidden);
    }
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: 'Error en servidor' });
  }
});

router.put('/', async (req: any, res: any) => {
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
      if (typeof theme !== 'string' || !THEME_CODES.includes(theme)) {
        return res.status(400).json({ error: 'Tema no válido' });
      }
      themeValue = theme;
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
         updated_at = $24
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
        new Date().toISOString(),
      ]
    );
    if (result.rowCount === 0) {
      await db.query(
        `INSERT INTO settings (id, company_name, company_logo, margin_minimum, payment_alias,
           payment_titular, phone, email, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from,
           smtp_enabled, currency, notif_interval, login_max_attempts, login_lockout_minutes,
           team_default_role, team_default_title, theme, sidebar_order, sidebar_hidden,
           login_tagline, updated_at)
         VALUES ('app', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
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
router.post('/test-mail', async (_req: any, res: any) => {
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
    await transport.sendMail({
      from: mailFrom(smtp),
      to: smtp.smtpUser,
      subject: 'Prueba SMTP - TeknoTech Services Cotizador',
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
