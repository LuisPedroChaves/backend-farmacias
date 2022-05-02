import { Router, Request, Response  } from 'express';

const appRouter = Router();

appRouter.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        ok: true,
        mensaje: '¡Bienvenidos al Backend!'
        });
});

export default appRouter;