import { Router, Request, Response } from 'express';
import { mdAuth } from '../middleware/auth';
import Symptoms from '../models/symptoms';

const SYMPTOMS_ROUTER = Router();

/* #region  GET */
SYMPTOMS_ROUTER.get('/', mdAuth, (req: Request, res: Response) => {
    Symptoms.find({
        deleted: false,
    })
        .sort({ name: 1 })
        .exec((err, symptoms) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando sintomas',
                    errors: err,
                });
            }

            res.status(200).json({
                ok: true,
                symptoms,
            });
        });
});
/* #endregion */

export default SYMPTOMS_ROUTER;