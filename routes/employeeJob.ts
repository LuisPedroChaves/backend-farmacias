import { Router, Request, Response } from 'express';
import { CREATE_LOG_DELETE } from '../functions/logDelete';

import { mdAuth } from '../middleware/auth';
import EmployeeJob, { IEmployeeJob } from '../models/employeeJob';

const EMPLOYEE_JOB_ROUTER = Router();

EMPLOYEE_JOB_ROUTER.get('/:idEmployee', mdAuth, (req: Request, res: Response) => {
    const _employee = req.params.idEmployee

    EmployeeJob.find({
        _employee,
        _logDelete: null,
    })
        .populate('_job')
        .exec((err, employeeJobs) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando puesto del empleado',
                    errors: err,
                });
            }

            res.status(200).json({
                ok: true,
                employeeJobs,
            });
        });
});

EMPLOYEE_JOB_ROUTER.put('/:id', mdAuth, (req: Request, res: Response) => {
    const ID: string = req.params.id;
    const BODY: IEmployeeJob = req.body;

    const {
        _job,
        _employee,
        initialSalary,
        salaryPerHour,
        monthlyHours,
        salaryExtraHours,
        lawBonus,
        bonus,
        startDate,
        contractType,
        contract,
        paymentType,
        workPlace
    } = BODY;

    EmployeeJob.findByIdAndUpdate(ID, {
        _job,
        _employee,
        initialSalary,
        salaryPerHour,
        monthlyHours,
        salaryExtraHours,
        lawBonus,
        bonus,
        startDate,
        contractType,
        contract,
        paymentType,
        workPlace
    },
        {
            new: true
        })
        .then((employeeJob: IEmployeeJob | null) => {

            res.status(200).json({
                ok: true,
                employeeJob,
            });

        })
        .catch((err: any) => {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al actualizar puesto del empleado',
                errors: err
            });
        })
})

EMPLOYEE_JOB_ROUTER.delete('/:id', mdAuth, (req: any, res: Response) => {
    const ID: string = req.params.id;
    const DETAILS: string = req.query.details;

    EmployeeJob.findById(ID, (err, employeeJob) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar puesto del empleado',
                errors: err,
            });
        }

        if (!employeeJob) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El puesto del empleado con el id' + ID + ' no existe',
                errors: {
                    message: 'No existe un puesto del empleado con ese ID',
                },
            });
        }

        EmployeeJob.populate(employeeJob, { path: "_job" }, function (err, employeeJob) {
            EmployeeJob.populate(employeeJob, { path: "_employee" }, async function (err, employeeJob: IEmployeeJob) {
                const LOG_DELETE = await CREATE_LOG_DELETE(req.user, `Puesto - ${employeeJob._job.name}  - ${employeeJob?._employee.name}`, DETAILS);

                employeeJob._logDelete = LOG_DELETE;

                employeeJob.save((err, employeeJob) => {
                    if (err) {
                        return res.status(400).json({
                            ok: false,
                            mensaje: 'Error al borrar puesto del empleado',
                            errors: err,
                        });
                    }

                    res.status(200).json({
                        ok: true,
                        employeeJob,
                    });
                });
            });
        });
    });
})

EMPLOYEE_JOB_ROUTER.post('/', mdAuth, (req: Request, res: Response) => {
    const BODY: IEmployeeJob = req.body

    const {
        _job,
        _employee,
        initialSalary,
        salaryPerHour,
        monthlyHours,
        salaryExtraHours,
        lawBonus,
        bonus,
        startDate,
        contractType,
        contract,
        paymentType,
        workPlace
    } = BODY;

    const NEW_EMPLOYEE_JOB = new EmployeeJob({
        _job,
        _employee,
        initialSalary,
        salaryPerHour,
        monthlyHours,
        salaryExtraHours,
        lawBonus,
        bonus,
        startDate,
        contractType,
        contract,
        paymentType,
        workPlace
    })

    NEW_EMPLOYEE_JOB.save()
        .then(async (employeeJob: IEmployeeJob) => {

            res.status(200).json({
                ok: true,
                employeeJob,
            });

        })
        .catch(err => {
            res.status(400).json({
                ok: false,
                mensaje: 'Error al crear puesto del empleado',
                errors: err,
            });
        })
})

export default EMPLOYEE_JOB_ROUTER;