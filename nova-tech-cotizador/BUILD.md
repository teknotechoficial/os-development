# Nova Tech Cotizador - Crear el .exe

## 🚀 Instrucciones paso a paso

### Requisitos previos
- Node.js v18+ instalado
- npm instalado

### Paso 1: Instalar dependencias
```bash
cd nova-tech-cotizador
npm install
```

### Paso 2: Inicializar la base de datos
```bash
npm run db:init
```

### Paso 3: Crear el .exe (instalador NSIS)
```bash
npm run build:exe
```

Esto creará un instalador en:
```
dist/Nova Tech Cotizador-1.0.0.exe
```

### ¿Qué crea el .exe?
- ✅ Acceso directo en el **Escritorio**
- ✅ Acceso directo en el **Menú de Inicio**
- ✅ Se puede **desinstalar** desde Panel de Control
- ✅ Incluye **todas las dependencias** (no requiere Node.js instalado)
- ✅ Funciona como cualquier programa común

### Para desarrollo (sin instalar)
```bash
npm run dev        # Abre la app en modo desarrollo
npm start          # Compila y ejecuta la app
```

### Estructura de archivos clave
```
nova-tech-cotizador/
├── package.json          → Dependencias y scripts
├── tsconfig.json         → Config TS frontend
├── tsconfig.main.json    → Config TS backend
├── vite.config.ts        → Config Vite
├── electron-builder.config.js → Config .exe
├── index.html            → Entry point HTML
├── src/
│   ├── main/
│   │   ├── electron-main.ts → Entry Electron
│   │   ├── database.ts      → PostgreSQL
│   │   ├── ipc.ts           → Handlers
│   │   └── server.ts        → Express
│   ├── renderer/           → React app
│   └── shared/            → Lógica compartida
├── server/               → API backend
├── database/             → Schema + seed
├── assets/               → Logos e imágenes
└── dist/                 → Output de build
```

## 📝 Notas
- El .exe se crea con `electron-builder` (formato NSIS para Windows)
- La app conecta a PostgreSQL (configurar en `.env`)
- Para probar sin instalar: `npm run dev`
- Para distribuir: `npm run build:exe`
