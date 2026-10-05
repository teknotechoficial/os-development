import { Pool } from 'pg';

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
      code TEXT UNIQUE NOT NULL, password_hash TEXT, pin_hash TEXT,
      has_credentials BOOLEAN DEFAULT false, avatar TEXT,
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
    `ALTER TABLE settings ADD COLUMN IF NOT EXISTS smtp_host TEXT DEFAULT ''`,
    `ALTER TABLE settings ADD COLUMN IF NOT EXISTS smtp_port INTEGER DEFAULT 465`,
    `ALTER TABLE settings ADD COLUMN IF NOT EXISTS smtp_user TEXT DEFAULT ''`,
    `ALTER TABLE settings ADD COLUMN IF NOT EXISTS smtp_pass TEXT DEFAULT ''`,
    `ALTER TABLE settings ADD COLUMN IF NOT EXISTS smtp_from TEXT DEFAULT ''`,
    `ALTER TABLE settings ADD COLUMN IF NOT EXISTS smtp_enabled BOOLEAN DEFAULT false`,
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
  `ALTER TABLE settings ADD COLUMN IF NOT EXISTS sidebar_labels TEXT DEFAULT '{}'`,
  `ALTER TABLE settings ADD COLUMN IF NOT EXISTS app_icon TEXT DEFAULT ''`,
  `ALTER TABLE settings ADD COLUMN IF NOT EXISTS app_title_suffix TEXT DEFAULT 'Cotizador'`,
  `ALTER TABLE settings ADD COLUMN IF NOT EXISTS custom_version INTEGER DEFAULT 1`,
  `ALTER TABLE settings ADD COLUMN IF NOT EXISTS custom_log TEXT DEFAULT '[]'`,
  `ALTER TABLE settings ADD COLUMN IF NOT EXISTS custom_themes TEXT DEFAULT '[]'`,
  `ALTER TABLE settings ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT true`,
  `ALTER TABLE settings ADD COLUMN IF NOT EXISTS ai_name TEXT DEFAULT 'Nova IA'`,
  `ALTER TABLE settings ADD COLUMN IF NOT EXISTS ai_provider TEXT DEFAULT 'openai'`,
  `ALTER TABLE settings ADD COLUMN IF NOT EXISTS ai_base_url TEXT DEFAULT 'https://api.openai.com/v1'`,
  `ALTER TABLE settings ADD COLUMN IF NOT EXISTS ai_model TEXT DEFAULT 'gpt-4o-mini'`,
  `ALTER TABLE settings ADD COLUMN IF NOT EXISTS ai_api_key TEXT DEFAULT ''`,
  `ALTER TABLE settings ADD COLUMN IF NOT EXISTS ai_temperature REAL DEFAULT 0.7`,
  `CREATE TABLE IF NOT EXISTS login_attempts (
      id TEXT PRIMARY KEY, identifier TEXT NOT NULL, success BOOLEAN NOT NULL,
      ip TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier_created ON login_attempts (identifier, created_at)`,
    `CREATE TABLE IF NOT EXISTS recovery_tokens (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
      purpose TEXT NOT NULL CHECK (purpose IN ('password','pin')),
      token TEXT NOT NULL, expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS ai_messages (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), role TEXT NOT NULL CHECK (role IN ('user','assistant')), content TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE INDEX IF NOT EXISTS idx_ai_messages_user_created ON ai_messages (user_id, created_at)`,
    `CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT DEFAULT '',
      category TEXT NOT NULL, base_price REAL NOT NULL DEFAULT 0,
      icon TEXT DEFAULT '', active BOOLEAN DEFAULT true, sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `ALTER TABLE services ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT ''`,
    `CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, done BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
  ];
  for (const query of queries) {
    await db.query(query);
  }
  const migrations = [
    `ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_hash TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS has_credentials BOOLEAN DEFAULT false`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS title TEXT DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS can_customize_ui BOOLEAN DEFAULT false`,
    `ALTER TABLE quotes ADD COLUMN IF NOT EXISTS items TEXT DEFAULT '[]'`,
    `UPDATE users SET password_hash = NULL WHERE password_hash = 'hashed'`,
    `UPDATE users SET has_credentials = false WHERE password_hash IS NULL AND pin_hash IS NULL`,
    `DO $$ BEGIN
       ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
       ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('super_admin','gerente','vendedor','closer','desarrollador'));
     END $$`,
  ];
  for (const query of migrations) {
    try {
      await db.query(query);
    } catch (err) {
      console.warn('[Database] migration skipped:', query, err);
    }
  }
  const s = await db.query("SELECT * FROM settings WHERE id = 'app'");
  if (s.rows.length === 0) {
    await db.query("INSERT INTO settings (id, company_name) VALUES ('app', 'TeknoTech Services')");
  }
  console.log('[Database] PostgreSQL initialized');
}

export { pool };

export function toCamel(row: any): any {
  const out: any = {};
  for (const key of Object.keys(row)) {
    out[key.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase())] = row[key];
  }
  return out;
}

export function mapRows(rows: any[]): any[] {
  return rows.map(toCamel);
}
