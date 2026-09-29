# Nova Tech Cotizador - Instrucciones de Instalación

## Paso 1: Instalar dependencias
```bash
cd nova-tech-cotizador
npm install
```

## Paso 2: Inicializar base de datos
```bash
npm run db:init
```

## Paso 3: Agregar empleados al seed
Edite `database/seed.ts` con los datos de los empleados.

## Paso 4: Ejecutar en desarrollo
```bash
npm run dev
```

## Paso 5: Build para producción
```bash
npm run build
npm start
```

## Estructura del proyecto
```
nova-tech-cotizador/
├── package.json          ← Dependencias y scripts
├── tsconfig.json         ← Configuración TypeScript
├── vite.config.ts        ← Configuración Vite
├── electron-builder.config.js  ← Configuración de empaquetado
├── .env                  ← Variables de entorno
├── .gitignore            ← Archivos ignorados
├── start.bat            ← Inicio fácil
├── dev.bat              ← Modo desarrollo
├── index.html            ← Entry point HTML
├── tailwind.config.js    ← Configuración Tailwind
├── postcss.config.js     ← Configuración PostCSS
├── database/
│   ├── schema.ts         ← Schema SQLite/PostgreSQL
│   └── seed.ts           ← Datos de empleados (completar)
├── server/
│   ├── index.ts          ← Server Express
│   ├── server.ts         ← Entry point del servidor
│   └── routes/
│       ├── api.ts        ← Rutas principales (auth, quotes, team)
│       ├── availability.ts ← Rutas de disponibilidad
│       ├── team.ts       ← Rutas de equipo
│       ├── notifications.ts ← Rutas de notificaciones
│       ├── settings.ts   ← Rutas de configuración
│       └── quotes.ts     ← Rutas de cotizaciones
└── src/
    ├── main/             ← Electron main process
    │   ├── index.ts      ← Entry point Electron
    │   ├── database.ts   ← Conexión SQLite
    │   ├── ipc.ts        ← Handlers IPC
    │   └── server.ts     ← Express server
    ├── renderer/         ← React frontend
    │   ├── index.tsx     ← Entry point React
    │   ├── App.tsx       ← Router principal
    │   ├── preload.ts    ← Electron preload
    │   ├── pages/        ← 8 páginas
    │   │   ├── Login.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── NewQuote.tsx
    │   │   ├── QuoteHistory.tsx
    │   │   ├── QuoteDetail.tsx
    │   │   ├── TeamManager.tsx
    │   │   ├── DeveloperWorkspace.tsx
    │   │   ├── Notifications.tsx
    │   │   └── Settings.tsx
    │   ├── components/   ← 7 componentes
    │   │   ├── QuoteCard.tsx
    │   │   ├── ProductSelector.tsx
    │   │   ├── ConfigForm.tsx
    │   │   ├── PriceBreakdown.tsx
    │   │   ├── DeveloperSelector.tsx
    │   │   └── StatusBadge.tsx
    │   ├── store/        ← 3 Zustand stores
    │   │   ├── auth.ts
    │   │   ├── quotes.ts
    │   │   └── team.ts
    │   └── styles/
    │       ├── globals.css
    │       └── components.css
    └── shared/           ← Módulos compartidos
        ├── pricing.ts    ← Motor de precios + margen $250
        ├── validators.ts ← Validaciones y formatos
        ├── constants.ts  ← Constantes de empresa
        ├── types.ts      ← Tipos TypeScript
        └── index.ts      ← Exports públicos
```

## Para el equipo
1. Cada miembro necesita su código de acceso (asignado por Super Admin)
2. Los desarrolladores verán su disponibilidad actualizada automáticamente
3. Los vendedores solo ven sus cotizaciones y devs disponibles
4. El Gerente tiene acceso completo al sistema

## Nota
El seed de empleados se completará cuando se proporcione la lista.
