import { Router } from 'express';
// Importaciones
import appRouter from './app';
import cellarRouter from './cellar';
import roleRouter from './role';
import userRouter from './user';
import loginRouter from './login';
import customerRouter from './customer';
import orderRouter from './order';
import routeRouter from './route';

const router = Router();

// Rutas
router.use('/route', routeRouter);
router.use('/order', orderRouter);
router.use('/customer', customerRouter);
router.use('/login', loginRouter);
router.use('/user', userRouter);
router.use('/role', roleRouter);
router.use('/cellar', cellarRouter);
router.use('/', appRouter);


export default router;
