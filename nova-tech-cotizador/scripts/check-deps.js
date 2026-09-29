const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const NODE_MODULES = path.join(ROOT, 'node_modules');

// Check if key packages exist
const REQUIRED = ['better-sqlite3', 'electron', 'react', 'react-dom', 'zustand', 'express', 'cors'];

console.log('🔍 Verificando dependencias...\n');
let missing = [];
for (const pkg of REQUIRED) {
  const exists = fs.existsSync(path.join(NODE_MODULES, pkg));
  console.log(`${exists ? '✅' : '❌'} ${pkg}`);
  if (!exists) missing.push(pkg);
}

console.log(`\n📊 ${REQUIRED.length - missing.length}/${REQUIRED.length} instaladas`);

if (missing.length > 0) {
  console.log(`\n⚠️ Faltan: ${missing.join(', ')}`);
  console.log('\nEjecutando npm install...');
  try {
    execSync('npm install --legacy-peer-deps', { cwd: ROOT, stdio: 'inherit', timeout: 300000 });
    console.log('\n✅ Instalación completada');
  } catch (e) {
    console.error('\n❌ Error en npm install');
  }
} else {
  console.log('\n✅ Todas las dependencias están instaladas');
  console.log('\nEjecuta: npm run dev');
}
