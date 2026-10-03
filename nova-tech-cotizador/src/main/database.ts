import { Pool } from 'pg';
import { join } from 'path';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/nova_tech',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}

export async function initDatabase(): Promise<void> {
  const db = getPool();
  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, avatar TEXT,
      role TEXT NOT NULL CHECK (role IN ('super_admin','gerente','vendedor','closer','desarrollador')),
      is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      title TEXT DEFAULT '', phone TEXT DEFAULT '', bio TEXT DEFAULT ''
    )`,
    `CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY, client_name TEXT NOT NULL, client_type TEXT NOT NULL,
      product_type TEXT NOT NULL, config TEXT NOT NULL, base_price REAL NOT NULL,
      margin REAL DEFAULT 250.0, final_price REAL NOT NULL,
      status TEXT DEFAULT 'borrador', seller_id TEXT NOT NULL, developer_id TEXT,
      assigned_at TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, items TEXT DEFAULT '[]'
    )`,
    `CREATE TABLE IF NOT EXISTS availability (
      developer_id TEXT PRIMARY KEY REFERENCES users(id), status TEXT DEFAULT 'disponible',
      active_quotes INTEGER DEFAULT 0, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
      type TEXT NOT NULL, title TEXT NOT NULL, message TEXT NOT NULL,
      quote_id TEXT REFERENCES quotes(id), read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications (user_id, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications (user_id) WHERE read = false`,
    `CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY DEFAULT 'app', company_name TEXT DEFAULT 'TeknoTech Services',
      payment_alias TEXT DEFAULT 'belo.arg.usd', margin_minimum REAL DEFAULT 250.0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `ALTER TABLE settings ADD COLUMN IF NOT EXISTS payment_titular TEXT DEFAULT 'TeknoTech Services'`,
    `ALTER TABLE settings ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT ''`,
    `ALTER TABLE settings ADD COLUMN IF NOT EXISTS email TEXT DEFAULT ''`,
    `ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_logo TEXT`,
    `ALTER TABLE settings ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD'`,
    `ALTER TABLE settings ADD COLUMN IF NOT EXISTS notif_interval INTEGER DEFAULT 15`,
    `ALTER TABLE settings ADD COLUMN IF NOT EXISTS login_max_attempts INTEGER DEFAULT 5`,
    `ALTER TABLE settings ADD COLUMN IF NOT EXISTS login_lockout_minutes INTEGER DEFAULT 15`,
    `ALTER TABLE settings ADD COLUMN IF NOT EXISTS team_default_role TEXT DEFAULT 'vendedor'`,
  `ALTER TABLE settings ADD COLUMN IF NOT EXISTS team_default_title TEXT DEFAULT ''`,
  `ALTER TABLE settings ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'dark'`,
  `ALTER TABLE settings ADD COLUMN IF NOT EXISTS sidebar_order TEXT DEFAULT '[]'`,
  `ALTER TABLE settings ADD COLUMN IF NOT EXISTS sidebar_hidden TEXT DEFAULT '[]'`,
  `ALTER TABLE settings ADD COLUMN IF NOT EXISTS login_tagline TEXT DEFAULT 'Tecnología que impulsa,|lealtad que permanece.'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS title TEXT DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT ''`,
    `ALTER TABLE quotes ADD COLUMN IF NOT EXISTS items TEXT DEFAULT '[]'`,
  ];
  for (const query of queries) {
    await db.query(query);
  }
  const s = await db.query("SELECT * FROM settings WHERE id = 'app'");
  if (s.rows.length === 0) {
    await db.query("INSERT INTO settings (id, company_name) VALUES ('app', 'TeknoTech Services')");
  }
  console.log('[Database] PostgreSQL initialized');
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[Database] Connection closed');
  }
}

export { pool };
