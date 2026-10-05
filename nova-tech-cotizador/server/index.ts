import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase, getPool } from './db';
import apiRouter from './routes/api';
import authRouter from './routes/auth';
import availabilityRouter from './routes/availability';
import teamRouter from './routes/team';
import notificationsRouter from './routes/notifications';
import settingsRouter from './routes/settings';
import quotesRouter from './routes/quotes';
import servicesRouter from './routes/services';
import tasksRouter from './routes/tasks';
import assistantRouter from './routes/assistant';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
// Límite subido de 100kb (default de express.json) a 2mb: el editor de servicios
// guarda en `icon` un dataURL PNG de 512x512 (cientos de KB) y settings.company_logo
// también admite dataURL. Ver server/routes/services.ts para la validación de `icon`.
app.use(express.json({ limit: '2mb' }));

app.use('/api', apiRouter);
app.use('/api', authRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/team', teamRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/services', servicesRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/assistant', assistantRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', app: 'TeknoTech Services Cotizador', timestamp: new Date().toISOString() });
});

async function start() {
	await initDatabase();
	app.listen(PORT, () => {
		console.log(`[Server] TeknoTech Services Cotizador running on port ${PORT}`);
	}).on('error', (err) => {
		console.error('[Server] listen error:', err);
	});
}

if (require.main === module) {
	start().catch(console.error);
}

export { app, start };
