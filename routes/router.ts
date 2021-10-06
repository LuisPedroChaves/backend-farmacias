import { Router } from 'express';
// Importaciones
import appRouter from './app';
import cellarRouter from './cellar';
import roleRouter from './role';
import userRouter from './user';
import loginRouter from './login';
import CUSTOMER_ROUTER from './customer';
import orderRouter from './order';
import routeRouter from './route';
import saleRouter from './sale';
import internalOrderRouter from './internalOrder';
import uploadRouter from './upload';
import readFileRouter from './readFile';
import PRODUCT_ROUTER from './product';
import BRAND_ROUTER from './brand';
import SUBSTANCE_ROUTER from './substance';
import SYMPTOMS_ROUTER from './symptoms';
import PROVIDER_ROUTER from './provider';
import PURCHASE_ROUTER from './purchase';

const router = Router();

// Rutas
router.use('/purchase', PURCHASE_ROUTER);
router.use('/provider', PROVIDER_ROUTER);
router.use('/symptoms', SYMPTOMS_ROUTER);
router.use('/substance', SUBSTANCE_ROUTER);
router.use('/brand', BRAND_ROUTER);
router.use('/product', PRODUCT_ROUTER);
router.use('/readFile', readFileRouter);
router.use('/upload', uploadRouter);
router.use('/internalOrder', internalOrderRouter);
router.use('/sale', saleRouter);
router.use('/route', routeRouter);
router.use('/order', orderRouter);
router.use('/customer', CUSTOMER_ROUTER);
router.use('/login', loginRouter);
router.use('/user', userRouter);
router.use('/role', roleRouter);
router.use('/cellar', cellarRouter);
router.use('/', appRouter);


export default router;
