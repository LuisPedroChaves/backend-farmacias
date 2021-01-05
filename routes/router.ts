import { Router } from 'express';
// Importaciones
import appRouter from './app';
import cellarRouter from './cellar';

const router = Router();

// Rutas
router.use('/cellar', cellarRouter);
router.use('/', appRouter);


export default router;
