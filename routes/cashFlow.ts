import { Router, Request, Response } from 'express';
import moment from 'moment-timezone';

import { mdAuth } from '../middleware/auth';
import CashFlow, { ICashFlow } from '../models/cashFlow';
import { UPDATE_BALANCE } from '../functions/cash';

const CASH_FLOW_ROUTER = Router();

/* #region  GET */
CASH_FLOW_ROUTER.get('/:cash', mdAuth, (req: Request, res: Response) => {
    const _cash = req.params.cash;
    let state = req.query.state;
    state = String(state)

    CashFlow.find(
        {
            _cash,
            state
        }
    )
        .populate('_user')
        .sort({
            created: -1
        })
        .then((cashFlows: ICashFlow[]) => {
            res.status(200).json({
                ok: true,
                cashFlows,
            });
        })
        .catch((err: any) => {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error listando movimientos',
                errors: err,
            });
        })
});

CASH_FLOW_ROUTER.get('/today/:cash', mdAuth, (req: Request, res: Response) => {
    const _cash = req.params.cash;

    const DATE = moment().tz("America/Guatemala");
    const DATE_END = moment().tz("America/Guatemala").add(1, 'day').format();

    const MONTH = DATE.format('M');
    const YEAR = DATE.format('YYYY');
    const DAY = DATE.format('D');

    CashFlow.find(
        {
            _cash,
            created: {
                $gte: new Date(`${YEAR}, ${MONTH}, ${DAY}`),
                $lt: new Date(DATE_END)
            }
        }
    )
        .populate('_user')
        .sort({
            created: -1
        })
        .then(cashFlow => {
            res.status(200).json({
                ok: true,
                cashFlow,
            });
        })
        .catch(err => {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error listando movimientos',
                errors: err,
            });
        })
});

CASH_FLOW_ROUTER.get('/history/:cash', mdAuth, (req: Request, res: Response) => {
    const _cash = req.params.cash;

    let startDate = new Date(String(req.query.startDate));
    let endDate = new Date(String(req.query.endDate));
    endDate.setDate(endDate.getDate() + 1); // Sumamos un día para aplicar bien el filtro

    CashFlow.find(
        {
            _cash,
            created: {
                $gte: new Date(startDate.toDateString()),
                $lt: new Date(endDate.toDateString()),
            }
        }
    )
        .populate('_user')
        .sort({
            created: -1
        })
        .then(cashFlow => {
            res.status(200).json({
                ok: true,
                cashFlow,
            });
        })
        .catch(err => {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error listando movimientos',
                errors: err,
            });
        })
});
/* #endregion */

CASH_FLOW_ROUTER.put('/:id', mdAuth, (req: any, res: Response) => {
    const ID: string = req.params.id;
    const BODY: ICashFlow = req.body;

    const {
        state,
    }: ICashFlow = BODY;

    CashFlow.findByIdAndUpdate(ID, {
        state,
        updated: moment().tz("America/Guatemala").format(),
    },
        {
            new: true
        })
        .then(async (cashFlow: ICashFlow | null) => {

            if (cashFlow?.state === 'RECHAZADO') {

                const CURRENT_BALANCE = await UPDATE_BALANCE(cashFlow._cash, +cashFlow.expense);

                CashFlow.find(
                    {
                        _cash: cashFlow._cash,
                        created: {
                            $gt: new Date(cashFlow.created)
                        },
                        state: {
                            $ne: 'RECHAZADO'
                        }
                    }
                )
                    .sort({
                        created: 1
                    })
                    .then(async (cashFlows) => {

                        const INIT_BALANCE = +cashFlow.balance + +cashFlow.expense;
                        await REFRESH_BALANCE(cashFlows, INIT_BALANCE)

                        res.status(200).json({
                            ok: true,
                            balance: CURRENT_BALANCE
                        });
                    })
                    .catch(err => {
                        return res.status(500).json({
                            ok: false,
                            mensaje: 'Error listando movimientos',
                            errors: err,
                        });
                    })
                return
            }

            res.status(200).json({
                ok: true,
                cashFlow
            });
        })
        .catch((err: any) => {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al actualizar movimiento de caja',
                errors: err
            });
        })
})

CASH_FLOW_ROUTER.post('/', mdAuth, async (req: any, res: Response) => {
    const BODY: ICashFlow = req.body

    const {
        _cash,
        date,
        serie,
        noBill,
        details,
        income,
        expense,
        state,
    } = BODY;

    let balance = 0;

    if (income > 0) { // Sumamos los ingresos
        balance = await UPDATE_BALANCE(_cash, income)
    }

    if (expense > 0) { // Restamos los gastos
        balance = await UPDATE_BALANCE(_cash, -expense)
    }

    const NEW_CASH_FLOW = new CashFlow({
        _user: req.user._id,
        _cash,
        date,
        serie,
        noBill,
        details,
        state,
        income,
        expense,
        balance,
        created: moment().tz("America/Guatemala").format(),
    })

    NEW_CASH_FLOW.save()
        .then((cashFlow: ICashFlow) => {
            res.status(200).json({
                ok: true,
                cashFlow,
            });
        })
        .catch(err => {
            res.status(400).json({
                ok: false,
                mensaje: 'Error al crear movimiento de caja',
                errors: err,
            });
        })
})

const REFRESH_BALANCE = async (detail: ICashFlow[], initBalance: number): Promise<any> => {
    let balance = +initBalance;
    return Promise.all(
        detail.map(async (element: ICashFlow) => {

            balance += (+element.income - +element.expense);

            return CashFlow.findByIdAndUpdate(element._id, {
                balance: balance
            }).then()
        })
    );
};

export default CASH_FLOW_ROUTER;