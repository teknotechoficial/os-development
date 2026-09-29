import { initDatabase } from './database';

async function main() {
  await initDatabase();
  console.log('✅ TeknoTech Database initialized with PostgreSQL');
}

main().catch(console.error);
