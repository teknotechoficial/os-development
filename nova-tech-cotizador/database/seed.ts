import { initDatabase, getPool } from './schema';
import { calculateBasePrice, calculateFinalPrice } from '../src/shared/pricing';

const SEED_USERS = [
  { id: 'seed-sebastian', name: 'Sebastian', code: 'CEO001', role: 'super_admin', email: 'sebastian@novatech.com' },
  { id: 'seed-juan', name: 'Juan', code: 'GTE001', role: 'gerente', email: 'juan@novatech.com' },
  { id: 'seed-belen', name: 'Belen', code: 'DEV001', role: 'desarrollador', email: 'belen@novatech.com' },
  { id: 'seed-wilder', name: 'Wilder', code: 'DEV002', role: 'desarrollador', email: 'wilder@novatech.com' },
  { id: 'seed-evasisto', name: 'Evasisto', code: 'DEV003', role: 'desarrollador', email: 'evasisto@novatech.com' },
  { id: 'seed-amauir', name: 'Amauir', code: 'VEN001', role: 'vendedor', email: 'amauir@novatech.com' },
  { id: 'seed-emilia', name: 'Emilia', code: 'VEN002', role: 'vendedor', email: 'emilia@novatech.com' },
  { id: 'seed-federico', name: 'Federico', code: 'VEN003', role: 'vendedor', email: 'federico@novatech.com' },
  { id: 'seed-jhon', name: 'Jhon', code: 'VEN004', role: 'vendedor', email: 'jhon@novatech.com' },
  { id: 'seed-maria', name: 'Maria', code: 'VEN005', role: 'vendedor', email: 'maria@novatech.com' },
];

const SEED_SERVICES = [
  { id: 'svc-web', name: 'Desarrollo Web', category: 'web', basePrice: 150, sortOrder: 1, description: 'Sitios web a medida con diseño responsive y panel de administración.' },
  { id: 'svc-store', name: 'Tienda Online', category: 'ecommerce', basePrice: 300, sortOrder: 2, description: 'E-commerce con carrito, pasarela de pago y gestión de inventario.' },
  { id: 'svc-app', name: 'App Móvil', category: 'movil', basePrice: 500, sortOrder: 3, description: 'Aplicaciones nativas para Android e iOS con panel de administración.' },
  { id: 'svc-custom', name: 'Software a Medida', category: 'a-medida', basePrice: 400, sortOrder: 4, description: 'Sistemas internos, CRMs y herramientas personalizadas para tu negocio.' },
  { id: 'svc-maintenance', name: 'Mantenimiento', category: 'soporte', basePrice: 30, sortOrder: 5, description: 'Planes mensuales de soporte, actualizaciones y respaldo de tu sitio.' },
  { id: 'svc-seo', name: 'SEO / Marketing', category: 'marketing', basePrice: 100, sortOrder: 6, description: 'Posicionamiento en buscadores, campañas y gestión de redes sociales.' },
];

const SEED_QUOTES = [
  {
    id: 'demo-quote-01', clientName: 'Café La Esquina', clientType: 'empresa', productType: 'web',
    config: { pages: 6, features: ['blog', 'forms'], design: 'profesional' },
    status: 'aceptada', sellerId: 'seed-amauir', developerId: 'seed-belen', daysAgo: 165,
  },
  {
    id: 'demo-quote-02', clientName: 'Clínica Dental Sonrisa', clientType: 'empresa', productType: 'app',
    config: { platform: 'both', screens: 'medium', features: ['login', 'notifications'], complexity: 'profesional' },
    status: 'enviada', sellerId: 'seed-emilia', developerId: null, daysAgo: 132,
  },
  {
    id: 'demo-quote-03', clientName: 'Taller Mecánico López', clientType: 'marca_personal', productType: 'custom',
    config: { modules: 'medium', users: 'small', features: ['reports', 'invoicing'] },
    status: 'borrador', sellerId: 'seed-federico', developerId: null, daysAgo: 104,
  },
  {
    id: 'demo-quote-04', clientName: 'Boutique Aurora', clientType: 'empresa', productType: 'store',
    config: { products: 'medium', features: ['payment', 'shipping', 'reviews'], design: 'profesional' },
    status: 'pagada', sellerId: 'seed-jhon', developerId: 'seed-wilder', daysAgo: 73,
  },
  {
    id: 'demo-quote-05', clientName: 'Gimnasio IronFit', clientType: 'empresa', productType: 'app',
    config: { platform: 'android', screens: 'medium', features: ['login', 'notifications', 'payments'], complexity: 'basico' },
    status: 'aceptada', sellerId: 'seed-maria', developerId: 'seed-evasisto', daysAgo: 44,
  },
  {
    id: 'demo-quote-06', clientName: 'Bufete Herrera & Asociados', clientType: 'empresa', productType: 'custom',
    config: { modules: 'medium', users: 'medium', features: ['reports', 'crm'] },
    status: 'enviada', sellerId: 'seed-amauir', developerId: null, daysAgo: 21,
  },
  {
    id: 'demo-quote-07', clientName: 'Panadería Delicia', clientType: 'marca_personal', productType: 'maintenance',
    config: { type: 'web', level: 'avanzado', frequency: 'annual' },
    status: 'rechazada', sellerId: 'seed-emilia', developerId: null, daysAgo: 9,
  },
  {
    id: 'demo-quote-08', clientName: 'Startup FinTech Uno', clientType: 'empresa', productType: 'seo',
    config: { scope: 'nacional', services: ['seo', 'campaigns', 'content'], duration: 'quarterly' },
    status: 'borrador', sellerId: 'seed-federico', developerId: null, daysAgo: 2,
  },
];

const SEED_NOTIFICATIONS = [
  {
    id: 'demo-notif-01', userId: 'seed-juan', type: 'quote_accepted', title: 'Cotización aprobada',
    message: 'Cotización aprobada: Café La Esquina', quoteId: 'demo-quote-01', daysAgo: 12,
  },
  {
    id: 'demo-notif-02', userId: 'seed-belen', type: 'quote_delegated', title: 'Nueva cotización asignada',
    message: 'Nueva cotización asignada: Café La Esquina', quoteId: 'demo-quote-01', daysAgo: 13,
  },
  {
    id: 'demo-notif-03', userId: 'seed-wilder', type: 'quote_delegated', title: 'Nueva cotización asignada',
    message: 'Nueva cotización asignada: Boutique Aurora', quoteId: 'demo-quote-04', daysAgo: 7,
  },
  {
    id: 'demo-notif-04', userId: 'seed-evasisto', type: 'quote_delegated', title: 'Nueva cotización asignada',
    message: 'Nueva cotización asignada: Gimnasio IronFit', quoteId: 'demo-quote-05', daysAgo: 5,
  },
  {
    id: 'demo-notif-05', userId: 'seed-emilia', type: 'quote_rejected', title: 'Cotización rechazada',
    message: 'Cotización rechazada: Panadería Delicia', quoteId: 'demo-quote-07', daysAgo: 1,
  },
];

async function main() {
  await initDatabase();
  const pool = getPool();

  const settingsMigrations = [
    `ALTER TABLE settings ADD COLUMN IF NOT EXISTS payment_titular TEXT DEFAULT 'TeknoTech Services'`,
    `ALTER TABLE settings ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT ''`,
    `ALTER TABLE settings ADD COLUMN IF NOT EXISTS email TEXT DEFAULT ''`,
    `ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_logo TEXT`,
  ];
  for (const migration of settingsMigrations) {
    await pool.query(migration);
  }

  for (const user of SEED_USERS) {
    const result = await pool.query('SELECT id FROM users WHERE code = $1', [user.code]);
    if (result.rows.length === 0) {
      await pool.query(
        'INSERT INTO users (id, name, code, role, email, password_hash, pin_hash, has_credentials, is_active) VALUES ($1, $2, $3, $4, $5, NULL, NULL, false, true)',
        [user.id, user.name, user.code, user.role, user.email]
      );
      console.log(`✅ User created: ${user.name} (${user.role})`);
    } else {
      console.log(`⏭️ User exists: ${user.name}`);
    }
  }

  for (const svc of SEED_SERVICES) {
    await pool.query(
      `INSERT INTO services (id, name, description, category, base_price, active, sort_order)
       VALUES ($1, $2, $3, $4, $5, true, $6)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         category = EXCLUDED.category,
         base_price = EXCLUDED.base_price,
         sort_order = EXCLUDED.sort_order,
         active = true`,
      [svc.id, svc.name, svc.description, svc.category, svc.basePrice, svc.sortOrder]
    );
    console.log(`✅ Service seeded: ${svc.name}`);
  }
  const keepIds = SEED_SERVICES.map((s) => `'${s.id}'`).join(', ');
  await pool.query(`DELETE FROM services WHERE id NOT IN (${keepIds})`);
  console.log('🧹 Removed services outside the seed catalogue');

  const devs = ['seed-belen', 'seed-wilder', 'seed-evasisto'];
  for (const devId of devs) {
    const existing = await pool.query('SELECT * FROM availability WHERE developer_id = $1', [devId]);
    if (existing.rows.length === 0) {
      await pool.query(
        'INSERT INTO availability (developer_id, status, active_quotes, updated_at) VALUES ($1, $2, 0, NOW())',
        [devId, 'disponible']
      );
      console.log(`✅ Availability set: ${devId}`);
    } else {
      console.log(`⏭️ Availability exists: ${devId}`);
    }
  }

  await pool.query("DELETE FROM notifications WHERE id LIKE 'demo-%' OR quote_id LIKE 'demo-%'");
  await pool.query("DELETE FROM quotes WHERE id LIKE 'demo-%'");
  console.log('🧹 Previous demo quotes/notifications removed');

  for (const quote of SEED_QUOTES) {
    const basePrice = calculateBasePrice(quote.productType, quote.config);
    const finalPrice = calculateFinalPrice(basePrice);
    const margin = finalPrice - basePrice;
    const createdAt = new Date(Date.now() - quote.daysAgo * 86400000).toISOString();
    await pool.query(
      'INSERT INTO quotes (id, client_name, client_type, product_type, config, base_price, margin, final_price, status, seller_id, developer_id, assigned_at, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',
      [quote.id, quote.clientName, quote.clientType, quote.productType, JSON.stringify(quote.config), basePrice, margin, finalPrice, quote.status, quote.sellerId, quote.developerId, quote.developerId ? createdAt : null, createdAt, createdAt]
    );
    console.log(`✅ Demo quote created: ${quote.clientName}`);
  }

  for (const notif of SEED_NOTIFICATIONS) {
    const createdAt = new Date(Date.now() - notif.daysAgo * 86400000).toISOString();
    await pool.query(
      'INSERT INTO notifications (id, user_id, type, title, message, quote_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [notif.id, notif.userId, notif.type, notif.title, notif.message, notif.quoteId, createdAt]
    );
    console.log(`✅ Demo notification created: ${notif.title} -> ${notif.userId}`);
  }

  await pool.query(
    'UPDATE availability SET active_quotes = (SELECT count(*) FROM quotes WHERE quotes.developer_id = availability.developer_id), updated_at = NOW()'
  );
  console.log('✅ Availability counters refreshed');

  await pool.end();
  console.log('\n🎉 Seed completed! All employees registered.');
}

main().catch(console.error);
