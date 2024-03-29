import { Router, Request, Response } from 'express';

import { CREATE_LOG_DELETE } from '../functions/logDelete';
import { mdAuth } from '../middleware/auth';
import EmployeeJob from '../models/employeeJob';
import Rising, { IRising } from '../models/rising';
import { IEmployeeJob } from '../models/employeeJob';

const RISING_ROUTER = Router();

RISING_ROUTER.get('/', mdAuth, (req: Request, res: Response) => {

    Rising.find({
        _logDelete: null,
    })
        .populate({
            path: '_employeeJob',
            populate: {
                path: '_employee'
            }
        })
        .sort({ date: -1 })
        .exec((err, risings) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando aumentos',
                    errors: err,
                });
            }

            res.status(200).json({
                ok: true,
                risings,
            });
        });
});

RISING_ROUTER.get('/:idEmployee', mdAuth, (req: Request, res: Response) => {

    const _employee = req.params.idEmployee

    EmployeeJob.find({
        _employee,
        _logDelete: null,
    })
        .populate('_job')
        .exec(async (err, employeeJobs) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando puesto del empleado',
                    errors: err,
                });
            }

            let risings: any = await SEARCH_RISINGS(employeeJobs)

            res.status(200).json({
                ok: true,
                risings: risings.flat()
            });

        });
});

RISING_ROUTER.put('/:id', mdAuth, (req: Request, res: Response) => {
    const ID: string = req.params.id;
    const BODY: IRising = req.body;

    const {
        _employeeJob,
        date,
        type,
        details,
        hours,
        amount,
        approved,
        applied
    } = BODY;

    Rising.findByIdAndUpdate(ID, {
        _employeeJob,
        date,
        type,
        details,
        hours,
        amount,
        approved,
        applied
    },
        {
            new: true
        })
        .then((rising: IRising | null) => {

            res.status(200).json({
                ok: true,
                rising,
            });

        })
        .catch((err: any) => {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al actualizar aumento',
                errors: err
            });
        })
})

RISING_ROUTER.delete('/:id', mdAuth, (req: any, res: Response) => {
    const ID: string = req.params.id;
    const DETAILS: string = req.query.details;

    Rising.findById(ID, async (err, rising) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar aumento',
                errors: err,
            });
        }

        if (!rising) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El aumento con el id' + ID + ' no existe',
                errors: {
                    message: 'No existe un aumento con ese ID',
                },
            });
        }

        const LOG_DELETE = await CREATE_LOG_DELETE(req.user, `Aumento - ${rising?.details}`, DETAILS);

        rising._logDelete = LOG_DELETE;

        rising.save((err, rising) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al borrar aumento',
                    errors: err,
                });
            }

            res.status(200).json({
                ok: true,
                rising,
            });
        });

    });
})

RISING_ROUTER.post('/', mdAuth, (req: any, res: Response) => {
    const BODY: IRising = req.body

    const {
        _employeeJob,
        date,
        type,
        details,
        hours,
        amount,
        approved,
        applied
    } = BODY;

    const NEW_RISING = new Rising({
        _user: req.user,
        _employeeJob,
        date,
        type,
        details,
        hours,
        amount,
        approved,
        applied
    })

    NEW_RISING.save()
        .then(async (rising: IRising) => {

            res.status(200).json({
                ok: true,
                rising,
            });

        })
        .catch(err => {
            res.status(400).json({
                ok: false,
                mensaje: 'Error al crear aumento',
                errors: err,
            });
        })
})

export const SEARCH_RISINGS = (employeeJob: IEmployeeJob[]): Promise<IRising[][]> => {
    return Promise.all(
        employeeJob.map(async (_employeeJob: IEmployeeJob) => {

            let risings = await Rising.find({
                                    _employeeJob,
                                    _logDelete: null,
                                })
                                    .populate({
                                        path: '_employeeJob',
                                    })
                                    .sort({ date: -1 })
                                    .exec();

            return risings
        })
    );
};


export default RISING_ROUTER;