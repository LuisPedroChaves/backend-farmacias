import { Router, Request, Response } from 'express';
import { CREATE_LOG_DELETE } from '../functions/logDelete';

import { mdAuth } from '../middleware/auth';
import JobDepartment, { IJobDepartment } from '../models/jobDepartment';

const JOB_DEPARTMENT_ROUTER = Router();

JOB_DEPARTMENT_ROUTER.get('/', mdAuth, (req: Request, res: Response) => {

    JobDepartment.find({
        _logDelete: null,
    })
        .sort({ name: 1 })
        .exec((err, jobDepartments) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando departamentos',
                    errors: err,
                });
            }

            res.status(200).json({
                ok: true,
                jobDepartments,
            });
        });
});

JOB_DEPARTMENT_ROUTER.put('/:id', mdAuth, (req: Request, res: Response) => {
    const ID: string = req.params.id;
    const BODY: IJobDepartment = req.body;

    const {
        name,
    } = BODY;

    JobDepartment.findByIdAndUpdate(ID, {
        name,
    },
        {
            new: true
        })
        .then((jobDepartment: IJobDepartment | null) => {

            res.status(200).json({
                ok: true,
                jobDepartment,
            });

        })
        .catch((err: any) => {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al actualizar departamento',
                errors: err
            });
        })
})

JOB_DEPARTMENT_ROUTER.delete('/:id', mdAuth, (req: any, res: Response) => {
    const ID: string = req.params.id;
    const DETAILS: string = req.query.details;

    JobDepartment.findById(ID, async (err, jobDepartment) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar departamento',
                errors: err,
            });
        }

        if (!jobDepartment) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El departamento con el id' + ID + ' no existe',
                errors: {
                    message: 'No existe un departamento con ese ID',
                },
            });
        }

        const LOG_DELETE = await CREATE_LOG_DELETE(req.user, `Departamento de trabajo - ${jobDepartment?.name}`, DETAILS);

        jobDepartment._logDelete = LOG_DELETE;

        jobDepartment.save((err, jobDepartment) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al borrar departamento',
                    errors: err,
                });
            }

            res.status(200).json({
                ok: true,
                jobDepartment,
            });
        });
    });
})

JOB_DEPARTMENT_ROUTER.post('/', mdAuth, (req: Request, res: Response) => {
    const BODY: IJobDepartment = req.body

    const {
        name,
    } = BODY;

    const NEW_JOB_DEPARTMENT = new JobDepartment({
        name,
    })

    NEW_JOB_DEPARTMENT.save()
        .then(async (jobDepartment: IJobDepartment) => {

            res.status(200).json({
                ok: true,
                jobDepartment,
            });

        })
        .catch(err => {
            res.status(400).json({
                ok: false,
                mensaje: 'Error al crear departamento',
                errors: err,
            });
        })
})

export default JOB_DEPARTMENT_ROUTER;