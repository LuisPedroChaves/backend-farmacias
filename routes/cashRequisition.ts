import { Router, Request, Response } from 'express';
import moment from 'moment-timezone';
import { FilterQuery } from 'mongoose';

import { mdAuth } from '../middleware/auth';
import { CREATE_LOG_DELETE } from '../functions/logDelete';
import CashRequisition, { ICashRequisition } from '../models/cashRequisition';
import CashFlow, { ICashFlow } from '../models/cashFlow';

const CASH_REQUISITION_ROUTER = Router();

/* #region  GET */
CASH_REQUISITION_ROUTER.get('/', mdAuth, (req: Request, res: Response) => {
    CashRequisition.find({
        paid: false,
        _logDelete: null
    })
        .populate({
            path: '_cash',
            populate: {
                path: '_user'
            }
        })
        .populate('_check')
        .populate({
            path: '_cashFlows',
            populate: {
                path: '_user'
            }
        })
        .sort({ created: 1 })
        .exec((err, cashRequisitions) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando requisiciones',
                    errors: err,
                });
            }

            res.status(200).json({
                ok: true,
                cashRequisitions,
            });
        });
});

CASH_REQUISITION_ROUTER.get('/history', mdAuth, (req: Request, res: Response) => {
    let startDate = new Date(String(req.query.startDate));
    let endDate = new Date(String(req.query.endDate));
    endDate.setDate(endDate.getDate() + 1); // Sumamos un día para aplicar bien el filtro

    let conditions: FilterQuery<ICashRequisition> = {
        created: {
            $gte: new Date(startDate.toDateString()),
            $lt: new Date(endDate.toDateString()),
        },
        paid: true,
        _logDelete: null
    };

    CashRequisition.find(conditions)
        .populate({
            path: '_cash',
            populate: {
                path: '_user'
            }
        })
        .populate('_check')
        .populate({
            path: '_cashFlows',
            populate: {
                path: '_user'
            }
        })
        .sort({ created: 1 })
        .exec((err, cashRequisitions) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando requisiciones',
                    errors: err,
                });
            }

            res.status(200).json({
                ok: true,
                cashRequisitions,
            });
        });
});

CASH_REQUISITION_ROUTER.get('/:cash', mdAuth, (req: Request, res: Response) => {
    const _cash = req.params.cash;

    CashRequisition.aggregate([
        {
            $match: {
                _cash,
                paid: false,
                _logDelete: null
            }
        },
        {
            $unwind: '$_cashFlows'
        },
    ])
        .then((cashRequisitions: ICashRequisition[]) => {
            console.log(cashRequisitions);

            res.status(200).json({
                ok: true,
                cashRequisitions
            });
        })
        .catch((err) => {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error listando requisiciones',
                errors: err
            });
        });
});
/* #endregion */

CASH_REQUISITION_ROUTER.put('/:id', mdAuth, (req: Request, res: Response) => {
    const ID: string = req.params.id;
    const BODY: ICashRequisition = req.body;

    CashRequisition.findByIdAndUpdate(ID, {
        _check: BODY._check,
        paid: BODY.paid,
        updated: moment().tz("America/Guatemala").format(),
    },
        {
            new: true
        })
        .then((cashRequisition: ICashRequisition | null) => {
            res.status(200).json({
                ok: true,
                cashRequisition
            });
        })
        .catch((err: any) => {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al actualizar requisicion',
                errors: err
            });
        })
})

CASH_REQUISITION_ROUTER.delete('/:id', mdAuth, (req: any, res: Response) => {
    const ID: string = req.params.id;
    const DETAILS: string = req.query.details;

    CashRequisition.findById(ID, async (err, cashRequisition) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar requisicion',
                errors: err,
            });
        }

        if (!cashRequisition) {
            return res.status(400).json({
                ok: false,
                mensaje: 'La requisicion con el id' + ID + ' no existe',
                errors: {
                    message: 'No existe una requisicion con ese ID',
                },
            });
        }

        const LOG_DELETE = await CREATE_LOG_DELETE(req.user, `Requisición de caja - Total: Q${cashRequisition?.total}`, DETAILS);

        cashRequisition._logDelete = LOG_DELETE;

        cashRequisition.save((err, cashRequisition) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al borrar requisicion',
                    errors: err,
                });
            }

            res.status(200).json({
                ok: true,
                cashRequisition,
            });
        });
    });
})

CASH_REQUISITION_ROUTER.post('/', mdAuth, (req: Request, res: Response) => {
    const BODY: ICashRequisition = req.body

    const {
        _cash,
        _cashFlows,
        total,
    } = BODY;

    const NEW_CASH_REQUISITION = new CashRequisition({
        _cash,
        _cashFlows,
        total,
        created: moment().tz("America/Guatemala").format(),
    })

    NEW_CASH_REQUISITION.save()
        .then(async (cashRequisition: ICashRequisition) => {

            await UPDATE_CASH_FLOWS(_cashFlows);

            res.status(200).json({
                ok: true,
                cashRequisition,
            });
        })
        .catch(err => {
            res.status(400).json({
                ok: false,
                mensaje: 'Error al crear requisicion',
                errors: err,
            });
        })
})

const UPDATE_CASH_FLOWS = async (cashFlows: ICashFlow[]): Promise<any> => {
    return Promise.all(
        cashFlows.map(async (cashFlow: ICashFlow) => {

            return CashFlow.updateOne(
                {
                    _id: cashFlow._id,
                },
                {
                    state: 'REQUISICION',
                },
            ).exec();
        })
    );
};

export default CASH_REQUISITION_ROUTER;