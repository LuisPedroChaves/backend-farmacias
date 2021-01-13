import { Router } from 'express';
// Importaciones
import appRouter from './app';
import cellarRouter from './cellar';
import roleRouter from './role';
import userRouter from './user';
import loginRouter from './login';

const router = Router();

// Rutas
router.use('/login', loginRouter);
router.use('/user', userRouter);
router.use('/role', roleRouter);
router.use('/cellar', cellarRouter);
router.use('/', appRouter);


export default router;
