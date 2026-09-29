import { Router } from 'express';

const router = Router();

// Health
router.get('/health', (_req: any, res: any) => {
  res.json({ status: 'ok', app: 'TeknoTech Services Cotizador', timestamp: new Date().toISOString() });
});

export default router;
