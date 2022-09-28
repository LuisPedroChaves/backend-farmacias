import { Router, Request, Response } from 'express';
import { CREATE_LOG_DELETE } from '../functions/logDelete';

import { mdAuth } from '../middleware/auth';
import Employee, { IEmployee } from '../models/employee';

const EMPLOYEE_ROUTER = Router();

EMPLOYEE_ROUTER.get('/', mdAuth, (req: any, res: Response) => {

    let cellars = JSON.parse(req.query.cellars);

    let _cellars: any[] = [];

    cellars.forEach((cellar: any) => {
        _cellars.push(String(cellar));
    });

    Employee.find({
        _logDelete: null,
        _cellar: {
            $in: _cellars
        }
    })
        .sort({ code: 1 })
        .exec((err, employees) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando empleados',
                    errors: err,
                });
            }

            res.status(200).json({
                ok: true,
                employees,
            });
        });
});

EMPLOYEE_ROUTER.put('/:id', mdAuth, (req: Request, res: Response) => {
    const ID: string = req.params.id;
    const BODY: IEmployee = req.body;

    const {
        _bank,
        _cellar,
        code,
        name,
        lastName,
        family,
        nit,
        email,
        birth,
        gender,
        maritalStatus,
        address,
        city,
        department,
        docType,
        document,
        profession,
        academicLavel,
        photo,
        igss,
        benefits,
        bankAccount,
        vacationDate,
        lastVacationDate,
        details,
        fired,
    } = BODY;

    Employee.findByIdAndUpdate(ID, {
        _bank,
        _cellar,
        code,
        name,
        lastName,
        family,
        nit,
        email,
        birth,
        gender,
        maritalStatus,
        address,
        city,
        department,
        docType,
        document,
        profession,
        academicLavel,
        photo,
        igss,
        benefits,
        bankAccount,
        vacationDate,
        lastVacationDate,
        details,
        fired,
    },
        {
            new: true
        })
        .then((employee: IEmployee | null) => {

            res.status(200).json({
                ok: true,
                employee,
            });

        })
        .catch((err: any) => {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al actualizar empleado',
                errors: err
            });
        })
})

EMPLOYEE_ROUTER.delete('/:id', mdAuth, (req: any, res: Response) => {
    const ID: string = req.params.id;
    const DETAILS: string = req.query.details;

    Employee.findById(ID, async (err, employee) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar empleado',
                errors: err,
            });
        }

        if (!employee) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El empleado con el id' + ID + ' no existe',
                errors: {
                    message: 'No existe un empleado con ese ID',
                },
            });
        }

        const LOG_DELETE = await CREATE_LOG_DELETE(req.user, `Empleado - ${employee?.name}`, DETAILS);

        employee._logDelete = LOG_DELETE;

        employee.save((err, employee) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al borrar empleado',
                    errors: err,
                });
            }

            res.status(200).json({
                ok: true,
                employee,
            });
        });
    });
})

EMPLOYEE_ROUTER.post('/', mdAuth, (req: Request, res: Response) => {
    const BODY: IEmployee = req.body

    const {
        _bank,
        _cellar,
        code,
        name,
        lastName,
        family,
        nit,
        email,
        birth,
        gender,
        maritalStatus,
        address,
        city,
        department,
        docType,
        document,
        profession,
        academicLavel,
        photo,
        igss,
        benefits,
        bankAccount,
        vacationDate,
        lastVacationDate,
        details,
        fired,
    } = BODY;

    const NEW_EMPLOYEE = new Employee({
        _bank,
        _cellar,
        code,
        name,
        lastName,
        family,
        nit,
        email,
        birth,
        gender,
        maritalStatus,
        address,
        city,
        department,
        docType,
        document,
        profession,
        academicLavel,
        photo,
        igss,
        benefits,
        bankAccount,
        vacationDate,
        lastVacationDate,
        details,
        fired,
    })

    NEW_EMPLOYEE.save()
        .then(async (employee: IEmployee) => {

            res.status(200).json({
                ok: true,
                employee,
            });

        })
        .catch(err => {
            res.status(400).json({
                ok: false,
                mensaje: 'Error al crear empleado',
                errors: err,
            });
        })
})

export default EMPLOYEE_ROUTER;