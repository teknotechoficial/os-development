import { Router } from 'express';
import { randomInt, randomUUID } from 'crypto';
import { getPool, toCamel } from '../db';
import {
  hashSecret,
  verifySecret,
  makeSetupToken,
  readSetupToken,
  createMailTransport,
  mailFrom,
} from '../auth-helpers';

const router = Router();

const LOCKOUT_WINDOW = "NOW() - INTERVAL '15 minutes'";
const LOCKOUT_MAX = 5;
const VALIDATION_ERROR = 'La contraseña debe tener al menos 6 caracteres y el PIN debe ser de 4 dígitos.';
const INVALID_CREDENTIALS = 'Credenciales inválidas';
const INVALID_TOKEN = 'Token inválido o expirado';
const INVALID_CODE = 'Código inválido o expirado';

function safeUser(row: any): any {
  const { password_hash, pin_hash, ...rest } = row;
  return toCamel(rest);
}

async function findByIdentifier(db: any, identifier: string) {
  const r = await db.query(
    `SELECT * FROM users WHERE (lower(email) = lower($1) OR upper(code) = upper($1)) AND is_active = true LIMIT 1`,
    [identifier]
  );
  return r.rows[0] || null;
}

async function findByCode(db: any, code: string) {
  const r = await db.query(`SELECT * FROM users WHERE code = $1 AND is_active = true LIMIT 1`, [code]);
  return r.rows[0] || null;
}

async function logAttempt(db: any, identifier: string, success: boolean, ip: string | null) {
  try {
    await db.query(
      'INSERT INTO login_attempts (id, identifier, success, ip) VALUES ($1, $2, $3, $4)',
      [randomUUID(), identifier.toLowerCase(), success, ip]
    );
  } catch (err) {
    console.error('[auth] logAttempt]', err);
  }
}

async function isLockedOut(db: any, identifier: string): Promise<boolean> {
  const r = await db.query(
    `SELECT count(*)::int AS n FROM login_attempts
     WHERE identifier = $1 AND success = false AND created_at > ${LOCKOUT_WINDOW}`,
    [identifier.toLowerCase()]
  );
  return (r.rows[0]?.n || 0) >= LOCKOUT_MAX;
}

// POST /api/login
router.post('/login', async (req: any, res: any) => {
  const db = getPool();
  const body = req.body || {};
  const identifier = typeof body.identifier === 'string' && body.identifier.trim() !== '' ? body.identifier.trim() : null;
  const code = typeof body.code === 'string' && body.code.trim() !== '' ? body.code.trim() : null;
  const password = body.password !== undefined && body.password !== null ? String(body.password) : null;
  const pin = body.pin !== undefined && body.pin !== null ? String(body.pin) : null;
  const ip = req.ip || null;

  if (!identifier && !code) {
    return res.status(401).json({ error: INVALID_CREDENTIALS });
  }

  try {
    const attemptKey = identifier || code;
    if (await isLockedOut(db, attemptKey)) {
      return res.status(423).json({
        error: 'Demasiados intentos fallidos. Cuenta bloqueada temporalmente por 15 minutos.',
      });
    }

    const user = identifier ? await findByIdentifier(db, identifier) : await findByCode(db, code!);
    if (!user) {
      await logAttempt(db, attemptKey, false, ip);
      return res.status(401).json({ error: INVALID_CREDENTIALS });
    }

    if (!user.has_credentials) {
      if (!identifier && code && !pin) {
        const { token } = makeSetupToken(user.id, 600);
        return res.status(200).json({ setupRequired: true, token });
      }
      await logAttempt(db, attemptKey, false, ip);
      return res.status(401).json({ error: INVALID_CREDENTIALS });
    }

    let ok = false;
    if (identifier) {
      ok = !!password && verifySecret(password, user.password_hash);
    } else {
      ok = !!pin && /^\d{4}$/.test(pin) && verifySecret(pin, user.pin_hash);
    }

    if (!ok) {
      await logAttempt(db, attemptKey, false, ip);
      return res.status(401).json({ error: INVALID_CREDENTIALS });
    }

    await logAttempt(db, attemptKey, true, ip);
    return res.status(200).json({ user: safeUser(user), success: true });
  } catch (err) {
    console.error('[auth login]', err);
    return res.status(500).json({ error: 'Error en servidor' });
  }
});

// POST /api/auth/setup - first-time password/PIN creation
router.post('/auth/setup', async (req: any, res: any) => {
  const db = getPool();
  const body = req.body || {};
  const token = body.token;
  const password = body.password !== undefined && body.password !== null ? String(body.password) : '';
  const pin = body.pin !== undefined && body.pin !== null ? String(body.pin) : '';
  try {
    const userId = readSetupToken(token);
    if (!userId) return res.status(400).json({ error: INVALID_TOKEN });
    if (password.length < 6) {
      return res.status(400).json({ error: VALIDATION_ERROR });
    }
    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: VALIDATION_ERROR });
    }
    const u = await db.query('SELECT id FROM users WHERE id = $1 AND is_active = true', [userId]);
    if (u.rows.length === 0) return res.status(400).json({ error: INVALID_TOKEN });

    await db.query(
      'UPDATE users SET password_hash = $1, pin_hash = $2, has_credentials = true WHERE id = $3',
      [hashSecret(password), hashSecret(pin), userId]
    );
    const updated = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    return res.status(200).json({ user: safeUser(updated.rows[0]), success: true });
  } catch (err) {
    console.error('[auth setup]', err);
    return res.status(500).json({ error: 'Error en servidor' });
  }
});

// POST /api/auth/recover - always answers 200 when SMTP is configured
router.post('/auth/recover', async (req: any, res: any) => {
  const db = getPool();
  const rawIdentifier = req.body ? req.body.identifier : undefined;
  const identifier = rawIdentifier !== undefined && rawIdentifier !== null ? String(rawIdentifier).trim() : '';
  try {
    const s = await db.query("SELECT * FROM settings WHERE id = 'app'");
    const st = s.rows[0] || {};
    if (!st.smtp_enabled) {
      return res.status(400).json({ error: 'Recuperación por correo no configurada. Contactá al administrador.' });
    }

    const user = identifier ? await findByIdentifier(db, identifier) : null;
    if (!user || !user.email) {
      return res.status(200).json({ success: true, message: 'Si el usuario existe, recibirás un correo con el código de recuperación.' });
    }

    const smtp = {
      smtpHost: st.smtp_host || '',
      smtpPort: Number(st.smtp_port) || 465,
      smtpUser: st.smtp_user || '',
      smtpPass: st.smtp_pass || '',
      smtpFrom: st.smtp_from || '',
      smtpEnabled: !!st.smtp_enabled,
    };

    const code = String(randomInt(0, 1000000)).padStart(6, '0');
    try {
      await db.query(
        "UPDATE recovery_tokens SET used = true WHERE user_id = $1 AND purpose = 'password' AND used = false",
        [user.id]
      );
      await db.query(
        `INSERT INTO recovery_tokens (id, user_id, purpose, token, expires_at, used)
         VALUES ($1, $2, 'password', $3, NOW() + INTERVAL '15 minutes', false)`,
        [randomUUID(), user.id, code]
      );
    } catch (err) {
      console.error('[auth recover] token]', err);
      return res.status(500).json({ error: 'No se pudo enviar el correo. Verificá la configuración SMTP.' });
    }

    const text =
      `Hola ${user.name},\n\n` +
      'Recibimos una solicitud para recuperar tu contraseña en TeknoTech Services Cotizador.\n\n' +
      `Tu código de recuperación es: ${code}\n\n` +
      'El código tiene una validez de 15 minutos.\n\n' +
      'Si no solicitaste este código, ignorá este mensaje.';

    try {
      const transport = createMailTransport(smtp);
      await transport.sendMail({
        from: mailFrom(smtp),
        to: user.email,
        subject: 'Recuperación de contraseña - TeknoTech Services Cotizador',
        text,
      });
    } catch (err) {
      console.error('[auth recover] mail]', err);
      return res.status(500).json({ error: 'No se pudo enviar el correo. Verificá la configuración SMTP.' });
    }

    return res.status(200).json({ success: true, message: 'Si el usuario existe, recibirás un correo con el código de recuperación.' });
  } catch (err) {
    console.error('[auth recover]', err);
    return res.status(500).json({ error: 'No se pudo enviar el correo. Verificá la configuración SMTP.' });
  }
});

// POST /api/auth/reset - apply recovery code to password and/or PIN
router.post('/auth/reset', async (req: any, res: any) => {
  const db = getPool();
  const body = req.body || {};
  const identifier = body.identifier !== undefined && body.identifier !== null ? String(body.identifier).trim() : '';
  const token = body.token !== undefined && body.token !== null ? String(body.token).trim() : '';
  const password = body.password !== undefined && body.password !== null && body.password !== '' ? String(body.password) : null;
  const pin = body.pin !== undefined && body.pin !== null && body.pin !== '' ? String(body.pin) : null;

  try {
    if (!password && !pin) {
      return res.status(400).json({ error: 'Debe proporcionar una contraseña o un PIN.' });
    }
    if (password !== null && password.length < 6) {
      return res.status(400).json({ error: VALIDATION_ERROR });
    }
    if (pin !== null && !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: VALIDATION_ERROR });
    }

    const user = identifier ? await findByIdentifier(db, identifier) : null;
    if (!user || !token) return res.status(400).json({ error: INVALID_CODE });

    const t = await db.query(
      `SELECT id FROM recovery_tokens
       WHERE user_id = $1 AND purpose = 'password' AND token = $2 AND used = false AND expires_at > NOW()
       LIMIT 1`,
      [user.id, token]
    );
    if (t.rows.length === 0) return res.status(400).json({ error: INVALID_CODE });

    await db.query('UPDATE recovery_tokens SET used = true WHERE id = $1', [t.rows[0].id]);

    const sets: string[] = [];
    const values: any[] = [];
    if (password !== null) {
      values.push(hashSecret(password));
      sets.push(`password_hash = $${values.length}`);
    }
    if (pin !== null) {
      values.push(hashSecret(pin));
      sets.push(`pin_hash = $${values.length}`);
    }
    values.push(true);
    sets.push(`has_credentials = $${values.length}`);
    values.push(user.id);
    await db.query(`UPDATE users SET ${sets.join(', ')} WHERE id = $${values.length}`, values);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[auth reset]', err);
    return res.status(500).json({ error: 'Error en servidor' });
  }
});

// POST /api/auth/change - authenticated password/PIN change
router.post('/auth/change', async (req: any, res: any) => {
  const db = getPool();
  const body = req.body || {};
  const userId = body.userId;
  const field = body.field;
  const current = body.current !== undefined && body.current !== null ? String(body.current) : '';
  const next = body.next !== undefined && body.next !== null ? String(body.next) : '';

  try {
    if (field !== 'password' && field !== 'pin') {
      return res.status(400).json({ error: 'Campo inválido.' });
    }
    if (field === 'password' && next.length < 6) {
      return res.status(400).json({ error: VALIDATION_ERROR });
    }
    if (field === 'pin' && !/^\d{4}$/.test(next)) {
      return res.status(400).json({ error: VALIDATION_ERROR });
    }

    const u = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (u.rows.length === 0) return res.status(400).json({ error: 'Usuario no encontrado.' });

    const user = u.rows[0];
    const stored = field === 'password' ? user.password_hash : user.pin_hash;
    if (!verifySecret(current, stored)) {
      return res.status(401).json({ error: 'Credenciales actuales incorrectas' });
    }

    if (field === 'password') {
      await db.query('UPDATE users SET password_hash = $1, has_credentials = true WHERE id = $2', [
        hashSecret(next),
        userId,
      ]);
    } else {
      await db.query('UPDATE users SET pin_hash = $1, has_credentials = true WHERE id = $2', [
        hashSecret(next),
        userId,
      ]);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[auth change]', err);
    return res.status(500).json({ error: 'Error en servidor' });
  }
});

// GET /api/auth/access-log - historial de intentos de acceso (login_attempts)
router.get('/auth/access-log', async (req: any, res: any) => {
  const db = getPool();
  const rawParam = req.query.identifiers;
  const raw = Array.isArray(rawParam)
    ? rawParam.join(',')
    : rawParam !== undefined && rawParam !== null
      ? String(rawParam)
      : '';
  const identifiers = raw
    .split(',')
    .map((s: string) => s.trim().toLowerCase())
    .filter((s: string) => s !== '');

  if (identifiers.length === 0) {
    return res.status(200).json({ items: [] });
  }

  try {
    const r = await db.query(
      `SELECT id, identifier, success, ip, created_at FROM login_attempts
       WHERE identifier = ANY($1::text[]) ORDER BY created_at DESC LIMIT 12`,
      [identifiers]
    );
    const items = r.rows.map((row: any) => {
      const item = toCamel(row);
      if (item.createdAt instanceof Date) item.createdAt = item.createdAt.toISOString();
      return item;
    });
    return res.status(200).json({ items });
  } catch (err) {
    console.error('[auth access-log]', err);
    return res.status(500).json({ error: 'Error en servidor' });
  }
});

export default router;
