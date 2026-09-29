import { Router } from 'express';
import { getPool, toCamel } from '../db';
import { createMailTransport, mailFrom } from '../auth-helpers';

const router = Router();

router.get('/', async (_req: any, res: any) => {
  const db = getPool();
  try {
    const s = await db.query("SELECT * FROM settings WHERE id = 'app'");
    res.json(s.rows[0] ? toCamel(s.rows[0]) : null);
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
  } = req.body || {};
  const marginValue = marginMinimum !== undefined ? marginMinimum : margin;
  try {
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
         updated_at = $14
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
        new Date().toISOString(),
      ]
    );
    if (result.rowCount === 0) {
      await db.query(
        `INSERT INTO settings (id, company_name, company_logo, margin_minimum, payment_alias,
           payment_titular, phone, email, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from,
           smtp_enabled, updated_at)
         VALUES ('app', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
