import { Router } from 'express';
// Importaciones
import appRouter from './app';
import cellarRouter from './cellar';
import roleRouter from './role';
import userRouter from './user';

const router = Router();

// Rutas
router.use('/user', userRouter);
router.use('/role', roleRouter);
router.use('/cellar', cellarRouter);
router.use('/', appRouter);


export default router;
