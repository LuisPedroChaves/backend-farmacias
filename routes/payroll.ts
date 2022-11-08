import { Router, Request, Response } from 'express';
import moment from 'moment-timezone';

import { CREATE_LOG_DELETE } from '../functions/logDelete';
import { mdAuth } from '../middleware/auth';
import Payroll, { IPayroll } from '../models/payroll';
import { IPayrollDetail } from '../models/payroll';
import EmployeeJob, { IEmployeeJob } from '../models/employeeJob';
import Employee from '../models/employee';
import Rising, { IRising } from '../models/rising';
import Discount, { IDiscount } from '../models/discount';

const PAYROLL_ROUTER = Router();

PAYROLL_ROUTER.get('/', mdAuth, (req: Request, res: Response) => {

    Payroll.find({
        _logDelete: null,
    }, 'description date total state created')
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

PAYROLL_ROUTER.get('/details', mdAuth, (req: Request, res: Response) => {

    EmployeeJob.find({
        _logDelete: null,
    })
        .populate('_job')
        .populate('_employee')
        .sort({ created: -1 })
        .exec(async (err, employeeJobs) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando detalle de planilla',
                    errors: err,
                });
            }

            let details: any[] = await SEARCH_DETAILS(employeeJobs)

            res.status(200).json({
                ok: true,
                details,
            });
        });
});

PAYROLL_ROUTER.get('/:id', mdAuth, (req: Request, res: Response) => {
    const id: string = req.params.id;

    Payroll.findById(id, (err, payroll) => {
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
                mensaje: 'La planilla con el id' + id + ' no existe',
                errors: {
                    message: 'No existe una planilla con ese ID',
                },
            });
        }

        EmployeeJob.populate(payroll, { path: "details._employeeJob" }, function (err, payroll) {
            Employee.populate(payroll, { path: "details._employeeJob._employee" }, async function (err, payroll) {
                Employee.populate(payroll, { path: "details._employeeJob._job" }, async function (err, payroll) {

                    res.status(200).json({
                        ok: true,
                        payroll,
                    });

                });
            });
        });

    });
});

PAYROLL_ROUTER.put('/:id', mdAuth, (req: Request, res: Response) => {
    const ID: string = req.params.id;
    const BODY: IPayroll = req.body;

    const {
        description,
        date,
        details,
        total,
        state
    } = BODY;

    Payroll.findByIdAndUpdate(ID, {
        description,
        date,
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
        date,
        details,
        total,
        state
    } = BODY;

    const NEW_PAYROLL = new Payroll({
        description,
        date,
        details,
        total,
        created: moment().tz("America/Guatemala").format(),
        state
    })

    NEW_PAYROLL.save()
        .then(async (payroll: IPayroll) => {

            await UPDATE_DETAILS(details)

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

export const SEARCH_DETAILS = (employeeJob: IEmployeeJob[]): Promise<any> => {
    return Promise.all(
        employeeJob.map(async (_employeeJob: IEmployeeJob) => {

            let detail: any = {}
            let total: number = _employeeJob.initialSalary;

            detail._employeeJob = _employeeJob
            detail.incentiveBonus = 250
            total += 250

            let risings = await Rising.find({
                approved: true,
                applied: false
            })
                .sort({ date: -1 })
                .exec()

            const jobBonus = risings.reduce((sum, item) => {
                if (item.type === 'horasExtra' || item.type === 'comisión' || item.type === 'bono') {
                    return sum + item.amount
                }
                return sum + 0
            }, 0)

            detail.jobBonus = jobBonus
            total += jobBonus
            detail.otherBonus = 0

            const igss = +(_employeeJob.initialSalary * 0.0483).toFixed(2)

            detail.igss = igss
            total -= igss
            detail.productCharges = 0
            detail.credits = 0

            let discounts = await Discount.find({
                approved: true,
                hasDiscount: true,
                applied: false
            })
                .sort({ date: -1 })
                .exec()

            const foults = risings.reduce((sum, item) => {
                if (item.type === 'horasExtra' || item.type === 'comisión' || item.type === 'bono') {
                    return sum + item.amount
                }
                return sum + 0
            }, 0)

            detail.foults = foults
            total -= foults

            detail.total = total
            detail.risings = risings
            detail.discounts = discounts

            return detail
        })
    );
};

export const UPDATE_DETAILS = (details: IPayrollDetail[]): Promise<any> => {
    return Promise.all(

        details.map(async (detail: IPayrollDetail) => {

            await UPDATE_DISCOUNTS(detail.discounts)
            await UPDATE_RISINGS(detail.risings)

            return true
        })
    );
};

const UPDATE_RISINGS = async (risings: IRising[]): Promise<any> => {
    return Promise.all(
        risings.map(async (rising: IRising) => {

            return Rising.updateOne(
                {
                    _id: rising._id,
                },
                {
                    applied: true,
                },
            ).exec();
        })
    );
};

const UPDATE_DISCOUNTS = async (discounts: IDiscount[]): Promise<any> => {
    return Promise.all(
        discounts.map(async (discount: IDiscount) => {

            return Discount.updateOne(
                {
                    _id: discount._id,
                },
                {
                    applied: true,
                },
            ).exec();
        })
    );
};

export default PAYROLL_ROUTER;