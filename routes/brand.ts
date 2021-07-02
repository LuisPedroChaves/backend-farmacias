import { Router, Request, Response } from 'express';
import { mdAuth } from '../middleware/auth';
import Brand from '../models/brand';

const BRAND_ROUTER = Router();

BRAND_ROUTER.post('/', mdAuth, (req: Request, res: Response) => {

    try {
        const BODY = req.body;

        const BRAND = new Brand({
            name: BODY.name,
        });

        BRAND
            .save()
            .then((brand) => {
                res.status(201).json({
                    ok: true,
                    brand
                });
            })
            .catch((err) => {
                res.status(400).json({
                    ok: false,
                    mensaje: 'Error al crear marca',
                    errors: err
                });
            });
    } catch (error) {
        console.log("🚀 ~ file: brand.ts ~ line 12 ~ BRAND_ROUTER.post ~ error", error)
    }
});

export default BRAND_ROUTER;