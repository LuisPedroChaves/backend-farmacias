import { Router, Request, Response } from 'express';
import { mdAuth } from '../middleware/auth';
import Brand from '../models/brand';

const BRAND_ROUTER = Router();

/* #region  GET */
BRAND_ROUTER.get('/', mdAuth, (req: Request, res: Response) => {
    Brand.find({
        deleted: false,
    })
        .sort({ name: 1 })
        .exec((err, brands) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando marcas',
                    errors: err,
                });
            }

            res.status(200).json({
                ok: true,
                brands,
            });
        });
});
/* #endregion */

export default BRAND_ROUTER;