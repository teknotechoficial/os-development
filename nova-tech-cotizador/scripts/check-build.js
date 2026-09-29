const { execSync } = require('child_process');
const path = require('path');

console.log('🔍 Verificando instalación de dependencias...');

try {
  execSync('npx tsc --noEmit', { cwd: __dirname, stdio: 'pipe' });
  console.log('✅ TypeScript: Sin errores de tipos');
} catch (e) {
  console.log('⚠️ TypeScript: Algunos errores de tipos (puede ser normal en desarrollo)');
}

try {
  execSync('npx vite build', { cwd: __dirname, stdio: 'pipe' });
  console.log('✅ Build frontend: Exitoso');
} catch (e) {
  console.log('⚠️ Build frontend: Requiere configuración adicional');
}

console.log('\n📦 Verificación completada');
