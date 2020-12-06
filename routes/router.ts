import { Router } from 'express';
// Importaciones
import appRouter from './app';

const router = Router();

// Rutas
router.use('/', appRouter)


export default router;
