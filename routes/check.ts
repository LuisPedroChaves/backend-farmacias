import { Router, Request, Response } from 'express';

import { mdAuth } from '../middleware/auth'
import Check, { ICheck } from '../models/check';

const CHECK_ROUTER = Router();

/* #region  GET'S */
CHECK_ROUTER.get('/', mdAuth, (req: Request, res: Response) => {

    Check.find(
        {
            deleted: false
        }
    )
        .sort({
            name: 1
        })
        .exec(async (err: any, providers: ICheck[]) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando proveedores',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                providers
            });
        });
});
/* #endregion */

CHECK_ROUTER.put('/:id', mdAuth, (req: Request, res: Response) => {
    const ID = req.params.id;
    const BODY: ICheck = req.body;

    Check.findByIdAndUpdate(ID, {
        no: BODY.no,
        city: BODY.city,
        date: BODY.date,
        name: BODY.name,
        description: BODY.description,
        amount: BODY.amount,
        state: BODY.state,
    },
        {
            new: true
        })
        .then((check: ICheck | null) => {
            res.status(200).json({
                ok: true,
                check
            });
        })
        .catch((err: any) => {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al actualizar cheque',
                errors: err
            });
        })
});

CHECK_ROUTER.post('/', mdAuth, (req: Request, res: Response) => {
    const BODY: ICheck = req.body;

    const newCheck = new Check({
        no: BODY.no,
        city: BODY.city,
        date: BODY.date,
        name: BODY.name,
        description: BODY.description,
        amount: BODY.amount,
        state: BODY.state,
    });

    newCheck
        .save()
        .then((check) => {
            res.status(200).json({
                ok: true,
                check,
            });
        })
        .catch((err) => {
            res.status(400).json({
                ok: false,
                mensaje: 'Error al crear cheque',
                errors: err,
            });
        });
});

export default CHECK_ROUTER;