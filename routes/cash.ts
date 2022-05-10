import { Router, Request, Response } from 'express';
import moment from 'moment-timezone';

import { mdAuth } from '../middleware/auth';
import Cash, { ICash } from '../models/cash';
import { CREATE_LOG_DELETE } from '../functions/logDelete';

const CASH_ROUTER = Router();

/* #region  GET */
CASH_ROUTER.get('/', mdAuth, (req: Request, res: Response) => {
    Cash.find(
        {
            _logDelete: null
        }
    )
        .populate('_user')
        .sort({
            type: 1
        })
        .then(cash => {
            res.status(200).json({
                ok: true,
                cash,
            });
        })
        .catch(err => {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error listando cajas',
                errors: err,
            });
        })
});

CASH_ROUTER.get('/user', mdAuth, (req: any, res: Response) => {
    let type = req.query.type;
    type = String(type);

    Cash.findOne(
        {
            _user: req.user._id,
            type,
            _logDelete: null
        }
    )
        .populate('_user')
        .sort({
            type: 1
        })
        .then(cash => {
            res.status(200).json({
                ok: true,
                cash,
            });
        })
        .catch(err => {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error listando caja',
                errors: err,
            });
        })
});
/* #endregion */

CASH_ROUTER.put('/:id', mdAuth, (req: Request, res: Response) => {
    const ID: string = req.params.id;
    const BODY: ICash = req.body;

    const {
        _user
    }: ICash = BODY;

    Cash.findByIdAndUpdate(ID, {
        _user,
        updated: moment().tz("America/Guatemala").format(),
    },
        {
            new: true
        })
        .then((cash: ICash | null) => {
            res.status(200).json({
                ok: true,
                cash
            });
        })
        .catch((err: any) => {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al actualizar caja',
                errors: err
            });
        })
})

CASH_ROUTER.delete('/:id', mdAuth, (req: any, res: Response) => {
    const ID: string = req.params.id;
    const DETAILS: string = req.query.details;

    Cash.findById(ID, async (err, cash) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar caja',
                errors: err,
            });
        }

        if (!cash) {
            return res.status(400).json({
                ok: false,
                mensaje: 'La caja con el id' + ID + ' no existe',
                errors: {
                    message: 'No existe una caja con ese ID',
                },
            });
        }

        const LOG_DELETE = await CREATE_LOG_DELETE(req.user, `Caja ${cash.type}`, DETAILS);

        cash._logDelete = LOG_DELETE;

        cash.save((err, cash) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al borrar caja',
                    errors: err,
                });
            }

            res.status(200).json({
                ok: true,
                cash,
            });
        });
    });
})

CASH_ROUTER.post('/', mdAuth, (req: Request, res: Response) => {
    const BODY: ICash = req.body

    const {
        _user,
        type,
        balance,
    } = BODY;

    const NEW_CASH = new Cash({
        _user,
        type,
        balance,
        created: moment().tz("America/Guatemala").format(),
    })

    NEW_CASH.save()
        .then(async (cash: ICash) => {
            res.status(200).json({
                ok: true,
                cash,
            });
        })
        .catch(err => {
            res.status(400).json({
                ok: false,
                mensaje: 'Error al crear caja',
                errors: err,
            });
        })
})

export default CASH_ROUTER;