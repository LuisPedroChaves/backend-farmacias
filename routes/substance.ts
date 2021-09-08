import { Router, Request, Response } from 'express';
import { mdAuth } from '../middleware/auth';
import Substance from '../models/substance';

const SUBSTANCE_ROUTER = Router();

/* #region  GET */
SUBSTANCE_ROUTER.get('/', mdAuth, (req: Request, res: Response) => {
    Substance.find({
        deleted: false,
    })
        .sort({ name: 1 })
        .exec((err, substances) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando sustancias',
                    errors: err,
                });
            }

            res.status(200).json({
                ok: true,
                substances,
            });
        });
});
/* #endregion */

export default SUBSTANCE_ROUTER;