import { Router, Request, Response } from 'express';
import moment from 'moment-timezone';

import { CREATE_LOG_DELETE } from '../functions/logDelete';
import { mdAuth } from '../middleware/auth';
import Payroll, { IPayroll } from '../models/payroll';

const PAYROLL_ROUTER = Router();

PAYROLL_ROUTER.get('/', mdAuth, (req: Request, res: Response) => {

    Payroll.find({
        _logDelete: null,
    })
        .sort({ created: -1 })
        .exec((err, payrolls) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando planillas',
                    errors: err,
                });
            }

            res.status(200).json({
                ok: true,
                payrolls,
            });
        });
});

PAYROLL_ROUTER.put('/:id', mdAuth, (req: Request, res: Response) => {
    const ID: string = req.params.id;
    const BODY: IPayroll = req.body;

    const {
        description,
        details,
        total,
        state
    } = BODY;

    Payroll.findByIdAndUpdate(ID, {
        description,
        details,
        total,
        state
    },
        {
            new: true
        })
        .then((payroll: IPayroll | null) => {

            res.status(200).json({
                ok: true,
                payroll,
            });

        })
        .catch((err: any) => {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al actualizar planilla',
                errors: err
            });
        })
})

PAYROLL_ROUTER.delete('/:id', mdAuth, (req: any, res: Response) => {
    const ID: string = req.params.id;
    const DETAILS: string = req.query.details;

    Payroll.findById(ID, async (err, payroll) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar planilla',
                errors: err,
            });
        }

        if (!payroll) {
            return res.status(400).json({
                ok: false,
                mensaje: 'La planilla con el id' + ID + ' no existe',
                errors: {
                    message: 'No existe una planilla con ese ID',
                },
            });
        }

        const LOG_DELETE = await CREATE_LOG_DELETE(req.user, `Planilla - ${payroll?.description}`, DETAILS);

        payroll._logDelete = LOG_DELETE;

        payroll.save((err, payroll) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al borrar planilla',
                    errors: err,
                });
            }

            res.status(200).json({
                ok: true,
                payroll,
            });
        });
    });
})

PAYROLL_ROUTER.post('/', mdAuth, (req: Request, res: Response) => {
    const BODY: IPayroll = req.body

    const {
        description,
        details,
        total,
        state
    } = BODY;

    const NEW_PAYROLL = new Payroll({
        description,
        details,
        total,
        created: moment().tz("America/Guatemala").format(),
        state
    })

    NEW_PAYROLL.save()
        .then(async (payroll: IPayroll) => {

            res.status(200).json({
                ok: true,
                payroll,
            });

        })
        .catch(err => {
            res.status(400).json({
                ok: false,
                mensaje: 'Error al crear planilla',
                errors: err,
            });
        })
})

export default PAYROLL_ROUTER;