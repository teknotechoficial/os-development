import { ipcMain, BrowserWindow } from 'electron';
import { getPool } from './database';
import { calculateBasePrice, calculateFinalPrice } from '../shared/pricing';
import { generateId } from '../shared/validators';

function registerHandlers() {
  ipcMain.handle('login', async (_event, code: string) => {
    const db = getPool();
    try {
      const result = await db.query('SELECT id, name, code, role, email, is_active FROM users WHERE code = $1 AND is_active = true', [code]);
      if (result.rows.length === 0) return { error: 'Código inválido' };
      const user = result.rows[0];
      return { user, success: true };
    } catch (err) {
      return { error: 'Error en servidor' };
    }
  });

  ipcMain.handle('getQuotes', async (_event, userId?: string, role?: string) => {
    const db = getPool();
    try {
      let query: string;
      if ((role === 'vendedor' || role === 'closer') && userId) {
        query = 'SELECT * FROM quotes WHERE seller_id = $1 ORDER BY created_at DESC';
        const result = await db.query(query, [userId]);
        return result.rows;
      }
      if (role === 'desarrollador' && userId) {
        query = 'SELECT * FROM quotes WHERE developer_id = $1 ORDER BY created_at DESC';
        const result = await db.query(query, [userId]);
        return result.rows;
      }
      const result = await db.query('SELECT * FROM quotes ORDER BY created_at DESC');
      return result.rows;
    } catch (err) {
      return [];
    }
  });

  ipcMain.handle('createQuote', async (_event, quoteData: any) => {
    const db = getPool();
    try {
      const basePrice = calculateBasePrice(quoteData.productType, quoteData.config);
      const st = await db.query("SELECT margin_minimum FROM settings WHERE id = 'app'");
      const floor =
        st.rows[0] && st.rows[0].margin_minimum !== null
          ? Number(st.rows[0].margin_minimum)
          : undefined;
      const finalPrice = calculateFinalPrice(basePrice, floor);
      const id = generateId();
      const now = new Date().toISOString();
      await db.query(
        'INSERT INTO quotes (id, client_name, client_type, product_type, config, base_price, margin, final_price, status, seller_id, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
        [id, quoteData.clientName, quoteData.clientType, quoteData.productType, JSON.stringify(quoteData.config), basePrice, finalPrice - basePrice, finalPrice, 'borrador', quoteData.sellerId, now, now]
      );
      return { id, success: true };
    } catch (err) {
      return { error: 'Error al crear cotización' };
    }
  });

  ipcMain.handle('getTeam', async () => {
    const db = getPool();
    try {
      const result = await db.query('SELECT id, name, code, role, is_active FROM users ORDER BY role, name');
      return result.rows;
    } catch (err) {
      return [];
    }
  });

  ipcMain.handle('getAvailability', async () => {
    const db = getPool();
    try {
      const result = await db.query('SELECT * FROM availability');
      return result.rows;
    } catch (err) {
      return [];
    }
  });

  ipcMain.handle('getNotifications', async (_event, userId: string) => {
    const db = getPool();
    try {
      const result = await db.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
      return result.rows;
    } catch (err) {
      return [];
    }
  });

  ipcMain.handle('markNotificationRead', async (_event, id: string) => {
    const db = getPool();
    try {
      await db.query('UPDATE notifications SET read = true WHERE id = $1', [id]);
      return { success: true };
    } catch (err) {
      return { error: 'Error en servidor' };
    }
  });

  ipcMain.handle('getSettings', async () => {
    const db = getPool();
    try {
      const result = await db.query("SELECT * FROM settings WHERE id = 'app'");
      return result.rows[0];
    } catch (err) {
      return null;
    }
  });

  ipcMain.handle('updateSettings', async (_event, settings: any) => {
    const db = getPool();
    try {
      await db.query("UPDATE settings SET company_name = $1, margin_minimum = $2, payment_alias = $3, updated_at = $4 WHERE id = 'app'", [settings.companyName, settings.marginMinimum, settings.paymentAlias, new Date().toISOString()]);
      return { success: true };
    } catch (err) {
      return { error: 'Error al guardar' };
    }
  });

  ipcMain.handle('generatePDF', async (_event, quoteId: string) => {
    return { success: true, message: 'PDF generado' };
  });

  ipcMain.handle('sendWhatsApp', async (_event, quoteId: string) => {
    return { success: true, message: 'Mensaje enviado' };
  });

  ipcMain.handle('set-title', (_event, title: unknown) => {
    if (typeof title === 'string' && title.trim()) {
      const clean = title.trim().slice(0, 120);
      BrowserWindow.getAllWindows().forEach((win) => win.setTitle(clean));
    }
    return true;
  });
}

export { registerHandlers };
