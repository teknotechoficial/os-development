import { Router } from 'express';
import { randomUUID } from 'crypto';
import { getPool, toCamel } from '../db';
import { callProvider, ChatMsg } from '../assistant/provider';
import { buildSystemPrompt } from '../assistant/prompt';
import { offlineReply } from '../assistant/offline';

const router = Router();

type Authz =
  | { ok: true; user: { id: string; name: string; role: string } }
  | { ok: false; status: number; error: string };

/* Chat requires an identified active user (pattern from settings.ts) */
const requireActiveUser = async (req: any): Promise<Authz> => {
  const userId = req.headers['x-user-id'];
  if (!userId || typeof userId !== 'string') {
    return { ok: false, status: 401, error: 'Identidad no proporcionada' };
  }
  try {
    const db = getPool();
    const r = await db.query('SELECT name, role, is_active FROM users WHERE id = $1', [userId]);
    const u = r.rows[0];
    if (!u || !u.is_active) return { ok: false, status: 401, error: 'Usuario no válido' };
    return { ok: true, user: { id: userId, name: u.name || '', role: u.role || '' } };
  } catch (err) {
    console.error('[assistant guard]', err);
    return { ok: false, status: 500, error: 'Error en servidor' };
  }
};

/* Provider test mutates nothing but exposes secrets: CEO or can_customize_ui */
const authorizeCustomization = async (req: any): Promise<Authz> => {
  const actorId = req.headers['x-user-id'];
  if (!actorId || typeof actorId !== 'string') {
    return { ok: false, status: 401, error: 'Identidad no proporcionada' };
  }
  try {
    const db = getPool();
    const r = await db.query(
      'SELECT name, role, is_active, can_customize_ui FROM users WHERE id = $1',
      [actorId]
    );
    const u = r.rows[0];
    if (!u || !u.is_active) return { ok: false, status: 401, error: 'Usuario no válido' };
    if (u.role !== 'super_admin' && !u.can_customize_ui) {
      return { ok: false, status: 403, error: 'Permisos insuficientes para personalizar la aplicación' };
    }
    return { ok: true, user: { id: actorId, name: u.name || '', role: u.role || '' } };
  } catch (err) {
    console.error('[assistant guard]', err);
    return { ok: false, status: 500, error: 'Error en servidor' };
  }
};

/* In-memory rate limit: max 20 chat requests per user every 60 seconds */
const hits = new Map<string, number[]>();

const rateLimited = (id: string): boolean => {
  const now = Date.now();
  const windowStart = now - 60_000;
  const list = (hits.get(id) || []).filter((t) => t > windowStart);
  const limited = list.length >= 20;
  if (!limited) list.push(now);
  hits.set(id, list);
  for (const [k, v] of hits) {
    if (v.length === 0 || v[v.length - 1] <= windowStart) hits.delete(k);
  }
  return limited;
};

/* Body history wins over DB history when it has at least one valid message */
const parseHistory = (history: any): ChatMsg[] => {
  if (!Array.isArray(history)) return [];
  const out: ChatMsg[] = [];
  for (const item of history) {
    if (out.length >= 12) break;
    if (!item || typeof item !== 'object') continue;
    const role = item.role;
    const content = item.content;
    if ((role === 'user' || role === 'assistant') && typeof content === 'string') {
      out.push({ role, content: content.slice(0, 2000) });
    }
  }
  return out;
};

// POST /api/assistant/chat
router.post('/chat', async (req: any, res: any) => {
  const auth = await requireActiveUser(req);
  if (!auth.ok) {
    const fail = auth as { ok: false; status: number; error: string };
    return res.status(fail.status).json({ error: fail.error });
  }
  const user = auth.user;
  try {
    const { message, history } = req.body || {};
    if (typeof message !== 'string') {
      return res.status(400).json({ error: 'Mensaje inválido (máx. 2000 caracteres)' });
    }
    const text = message.trim();
    if (text.length < 1 || text.length > 2000) {
      return res.status(400).json({ error: 'Mensaje inválido (máx. 2000 caracteres)' });
    }
    if (rateLimited(user.id)) {
      return res.status(429).json({ error: 'Demasiadas consultas, esperá un momento' });
    }

    const db = getPool();
    const s = await db.query(
      `SELECT ai_enabled, ai_name, ai_provider, ai_base_url, ai_model, ai_api_key, ai_temperature
       FROM settings WHERE id = 'app'`
    );
    const st = s.rows[0] || {};
    if (st.ai_enabled === false) {
      return res.status(403).json({ error: 'El asistente está deshabilitado por el administrador' });
    }

    let conv = parseHistory(history);
    if (conv.length === 0) {
      const h = await db.query(
        'SELECT role, content FROM ai_messages WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
        [user.id]
      );
      conv = h.rows
        .slice()
        .reverse()
        .map((m: any): ChatMsg => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: String(m.content),
        }));
    }
    conv.push({ role: 'user', content: text });

    const apiKey = typeof st.ai_api_key === 'string' ? st.ai_api_key.trim() : '';
    let reply: string;
    let mode: 'ai' | 'offline';
    if (!apiKey) {
      reply = offlineReply(text);
      mode = 'offline';
    } else {
      let services: string[] = [];
      try {
        const sv = await db.query(
          'SELECT name FROM services WHERE active = true ORDER BY sort_order, name LIMIT 40'
        );
        services = sv.rows.map((r: any) => String(r.name));
      } catch (err) {
        console.error('[assistant services]', err);
        services = [];
      }
      const system = buildSystemPrompt(
        { name: user.name, role: user.role },
        { appName: st.ai_name || 'TeknoTech Services Cotizador', services }
      );
      const out = await callProvider({
        baseUrl: typeof st.ai_base_url === 'string' ? st.ai_base_url : '',
        apiKey,
        model: typeof st.ai_model === 'string' ? st.ai_model : '',
        temperature: Number(st.ai_temperature) || 0.7,
        messages: [{ role: 'system', content: system }, ...conv],
      });
      if (out.ok && typeof out.content === 'string') {
        reply = out.content;
        mode = 'ai';
      } else {
        console.error('[assistant chat]', out.error || 'error del proveedor');
        reply = offlineReply(text);
        mode = 'offline';
      }
    }

    /* Persistence must never break the chat itself */
    try {
      await db.query('INSERT INTO ai_messages (id, user_id, role, content) VALUES ($1, $2, $3, $4)', [
        randomUUID(),
        user.id,
        'user',
        text,
      ]);
      await db.query('INSERT INTO ai_messages (id, user_id, role, content) VALUES ($1, $2, $3, $4)', [
        randomUUID(),
        user.id,
        'assistant',
        reply,
      ]);
    } catch (err) {
      console.error('[assistant persist]', err);
    }

    return res.json({ reply, mode });
  } catch (err) {
    console.error('[assistant chat]', err);
    return res.status(500).json({ error: 'Error al procesar la consulta' });
  }
});

// GET /api/assistant/history
router.get('/history', async (req: any, res: any) => {
  const auth = await requireActiveUser(req);
  if (!auth.ok) {
    const fail = auth as { ok: false; status: number; error: string };
    return res.status(fail.status).json({ error: fail.error });
  }
  try {
    const db = getPool();
    const r = await db.query(
      'SELECT id, role, content, created_at AS at FROM ai_messages WHERE user_id = $1 ORDER BY created_at ASC LIMIT 100',
      [auth.user.id]
    );
    res.json({ messages: r.rows.map(toCamel) });
  } catch (err) {
    console.error('[assistant history]', err);
    res.status(500).json({ error: 'Error al cargar el historial' });
  }
});

// DELETE /api/assistant/history
router.delete('/history', async (req: any, res: any) => {
  const auth = await requireActiveUser(req);
  if (!auth.ok) {
    const fail = auth as { ok: false; status: number; error: string };
    return res.status(fail.status).json({ error: fail.error });
  }
  try {
    const db = getPool();
    await db.query('DELETE FROM ai_messages WHERE user_id = $1', [auth.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[assistant delete]', err);
    res.status(500).json({ error: 'Error al eliminar el historial' });
  }
});

// POST /api/assistant/test
router.post('/test', async (req: any, res: any) => {
  const auth = await authorizeCustomization(req);
  if (!auth.ok) {
    const fail = auth as { ok: false; status: number; error: string };
    return res.status(fail.status).json({ error: fail.error });
  }
  try {
    const { baseUrl, apiKey, model } = req.body || {};
    if (typeof baseUrl !== 'string' || !/^https?:\/\//.test(baseUrl)) {
      return res.status(400).json({ error: 'URL base inválida' });
    }
    if (typeof apiKey !== 'string' || !apiKey.trim()) {
      return res.status(400).json({ error: 'Falta la clave API' });
    }
    const out = await callProvider({
      baseUrl,
      apiKey: apiKey.trim(),
      model: typeof model === 'string' ? model.trim() : '',
      temperature: 0,
      messages: [
        { role: 'system', content: 'Respondé solo: OK' },
        { role: 'user', content: 'ping' },
      ],
    });
    if (out.ok) return res.json({ ok: true });
    return res.json({ ok: false, error: out.error || 'No se pudo conectar con el proveedor' });
  } catch (err) {
    console.error('[assistant test]', err);
    return res.json({
      ok: false,
      error: err instanceof Error && err.message ? err.message : 'Error al probar el proveedor',
    });
  }
});

export default router;
