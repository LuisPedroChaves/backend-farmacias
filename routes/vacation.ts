import { Router, Request, Response } from 'express';
import { CREATE_LOG_DELETE } from '../functions/logDelete';

import { mdAuth } from '../middleware/auth';
import Vacation, { IVacation } from '../models/vacation';

const VACATION_ROUTER = Router();

VACATION_ROUTER.get('/:idEmployee', mdAuth, (req: Request, res: Response) => {
    const _employee = req.params.idEmployee

    Vacation.find({
        _employee,
        _logDelete: null,
    })
        .populate('_job')
        .exec((err, vacations) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando vacaciones del empleado',
                    errors: err,
                });
            }

            res.status(200).json({
                ok: true,
                vacations,
            });
        });
});

VACATION_ROUTER.put('/:id', mdAuth, (req: Request, res: Response) => {
    const ID: string = req.params.id;
    const BODY: IVacation = req.body;

    const {
        start,
        end,
        details
    } = BODY;

    Vacation.findByIdAndUpdate(ID, {
        start,
        end,
        details
    },
        {
            new: true
        })
        .then((vacation: IVacation | null) => {

            res.status(200).json({
                ok: true,
                vacation,
            });

        })
        .catch((err: any) => {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al actualizar vacaciones del empleado',
                errors: err
            });
        })
})

VACATION_ROUTER.delete('/:id', mdAuth, (req: any, res: Response) => {
    const ID: string = req.params.id;
    const DETAILS: string = req.query.details;

    Vacation.findById(ID, (err, vacation) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar vacaciones del empleado',
                errors: err,
            });
        }

        if (!vacation) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Las vacaciones del empleado con el id' + ID + ' no existe',
                errors: {
                    message: 'No existe unas vacaciones del empleado con ese ID',
                },
            });
        }

        Vacation.populate(vacation, { path: "_employee" }, async function (err, vacation: IVacation) {
            const LOG_DELETE = await CREATE_LOG_DELETE(req.user, `Vacaciones - ${vacation?._employee.name}`, DETAILS);

            vacation._logDelete = LOG_DELETE;

            vacation.save((err, vacation) => {
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        mensaje: 'Error al borrar vacaciones del empleado',
                        errors: err,
                    });
                }

                res.status(200).json({
                    ok: true,
                    vacation,
                });
            });
        });
    });
})

VACATION_ROUTER.post('/', mdAuth, (req: Request, res: Response) => {
    const BODY: IVacation = req.body

    const {
        _employee,
        start,
        end,
        constancy,
        details
    } = BODY;

    const NEW_VACATION = new Vacation({
        _employee,
        start,
        end,
        constancy,
        details
    })

    NEW_VACATION.save()
        .then(async (vacation: IVacation) => {

            res.status(200).json({
                ok: true,
                vacation,
            });

        })
        .catch(err => {
            res.status(400).json({
                ok: false,
                mensaje: 'Error al crear vacaciones del empleado',
                errors: err,
            });
        })
})

export default VACATION_ROUTER;