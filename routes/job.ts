import { Router, Request, Response } from 'express';
import { CREATE_LOG_DELETE } from '../functions/logDelete';

import { mdAuth } from '../middleware/auth';
import Job, { IJob } from '../models/job';

const JOB_ROUTER = Router();

JOB_ROUTER.get('/', mdAuth, (req: Request, res: Response) => {

    Job.find({
        _logDelete: null,
    })
        .sort({ name: 1 })
        .exec((err, jobs) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando puestos',
                    errors: err,
                });
            }

            res.status(200).json({
                ok: true,
                jobs,
            });
        });
});

JOB_ROUTER.put('/:id', mdAuth, (req: Request, res: Response) => {
    const ID: string = req.params.id;
    const BODY: IJob = req.body;

    const {
        _jobDepartment,
        name,
    } = BODY;

    Job.findByIdAndUpdate(ID, {
        _jobDepartment,
        name,
    },
        {
            new: true
        })
        .then((job: IJob | null) => {

            res.status(200).json({
                ok: true,
                job,
            });

        })
        .catch((err: any) => {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al actualizar puesto',
                errors: err
            });
        })
})

JOB_ROUTER.delete('/:id', mdAuth, (req: any, res: Response) => {
    const ID: string = req.params.id;
    const DETAILS: string = req.query.details;

    Job.findById(ID, async (err, job) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar puesto',
                errors: err,
            });
        }

        if (!job) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El puesto con el id' + ID + ' no existe',
                errors: {
                    message: 'No existe un puesto con ese ID',
                },
            });
        }

        const LOG_DELETE = await CREATE_LOG_DELETE(req.user, `Puesto de trabajo - ${job?.name}`, DETAILS);

        job._logDelete = LOG_DELETE;

        job.save((err, job) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al borrar puesto',
                    errors: err,
                });
            }

            res.status(200).json({
                ok: true,
                job,
            });
        });
    });
})

JOB_ROUTER.post('/', mdAuth, (req: Request, res: Response) => {
    const BODY: IJob = req.body

    const {
        _jobDepartment,
        name,
    } = BODY;

    const NEW_JOB = new Job({
        _jobDepartment,
        name,
    })

    NEW_JOB.save()
        .then(async (job: IJob) => {

            res.status(200).json({
                ok: true,
                job,
            });

        })
        .catch(err => {
            res.status(400).json({
                ok: false,
                mensaje: 'Error al crear puesto',
                errors: err,
            });
        })
})

export default JOB_ROUTER;