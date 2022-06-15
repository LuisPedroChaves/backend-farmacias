import { Router, Request, Response } from 'express';
import moment from 'moment-timezone';

import { mdAuth } from '../middleware/auth'
import Check, { ICheck } from '../models/check';
import AccountsPayable, { IAccountsPayable } from '../models/accountsPayable';
import { UPDATE_BALANCE } from '../functions/provider';
import { UPDATE_BANK_BALANCE } from '../functions/bank';
import BankFlow from '../models/bankFlow';
import CashRequisition, { ICashRequisition } from '../models/cashRequisition';
import CashFlow, { ICashFlow } from '../models/cashFlow';
import { UPDATE_CASH_BALANCE } from '../functions/cash';

const CHECK_ROUTER = Router();

/* #region  GET */
CHECK_ROUTER.get('/today', mdAuth, (req: Request, res: Response) => {

    const DATE = moment().tz("America/Guatemala");
    const DATE2 = moment().tz("America/Guatemala").add(1, 'days');

    const MONTH = DATE.format('M');
    const YEAR = DATE.format('YYYY');
    const DAY = DATE.format('D');
    const DAY2 = DATE2.format('D');

    const START_DATE = new Date(`${YEAR}, ${MONTH}, ${DAY}`)
    const END_DATE = new Date(`${YEAR}, ${MONTH}, ${DAY2}`)

    Check.find(
        {
            date: {
                $gte: START_DATE,
                $lt: END_DATE
            },
            voided: false
        }
    )
        .populate('_user')
        .populate('_bankAccount')
        .populate('accountsPayables')
        .populate('cashRequisitions')
        .sort({
            name: 1
        })
        .exec(async (err: any, checks: ICheck[]) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando cheques del dia',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                checks
            });
        });
});

CHECK_ROUTER.get('/state', mdAuth, (req: Request, res: Response) => {

    Check.find(
        {
            $and: [
                { state: { $ne: 'PAGADO' } },
                { state: { $ne: 'RECHAZADO' } },
            ],
            voided: false
        }
    )
        .populate('_user')
        .populate('_bankAccount')
        .populate('accountsPayables')
        .populate('cashRequisitions')
        .sort({
            name: 1
        })
        .exec(async (err: any, checks: ICheck[]) => {

            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando cheques',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                checks
            });
        });
});

CHECK_ROUTER.get('/deliveries', mdAuth, (req: Request, res: Response) => {

    Check.find(
        {
            $and: [
                { state: { $ne: 'PAGADO' } },
                { state: { $ne: 'RECHAZADO' } },
            ],
            delivered: false,
            voided: false,
        }
    )
        .populate('_user')
        .populate('_bankAccount')
        .populate('accountsPayables')
        .populate('cashRequisitions')
        .sort({
            name: 1
        })
        .exec(async (err: any, checks: ICheck[]) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando cheques',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                checks
            });
        });
});

CHECK_ROUTER.get('/history', mdAuth, (req: Request, res: Response) => {
    let startDate = new Date(String(req.query.startDate));
    let endDate = new Date(String(req.query.endDate));
    endDate.setDate(endDate.getDate() + 1); // Sumamos un día para aplicar bien el filtro

    Check.find(
        {
            date: {
                $gte: new Date(startDate.toDateString()),
                $lt: new Date(endDate.toDateString()),
            },
            voided: false,
        }
    )
        .populate('_user')
        .populate('_bankAccount')
        .populate('accountsPayables')
        .populate('cashRequisitions')
        .sort({
            date: 1
        })
        .exec(async (err: any, checks: ICheck[]) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando cheques',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                checks
            });
        });
})
/* #endregion */

CHECK_ROUTER.put('/state/:id', mdAuth, (req: Request, res: Response) => {
    const ID = req.params.id;
    const BODY: ICheck = req.body;

    if (!BODY.voided && BODY.state === 'PAGADO') {
        BODY.paymentDate = moment().tz("America/Guatemala").format()
    }

    Check.findById(ID, (err, check) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar cheque',
                errors: err
            });
        }

        if (!check) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El cheque con el id' + ID + ' no existe',
                errors: {
                    message: 'No existe un cheque con ese ID'
                }
            });
        }

        check.date = BODY.date
        check.state = BODY.state
        check.paymentDate = BODY.paymentDate
        check.receipt.no = BODY.receipt.no
        check.receipt.name = BODY.receipt.name
        check.delivered = BODY.delivered
        check.voided = BODY.voided

        check.save(async (err, check) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar cheque',
                    errors: err
                });
            }

            if (!BODY.voided && BODY.state === 'PAGADO') {
                await PAY_ACCOUNTS_PAYABLE(BODY);
                await PAY_CASH_REQUISITIONS(BODY);

                const NEW_BANK_FLOW = new BankFlow({
                    _bankAccount: BODY._bankAccount,
                    _check: check,
                    date: moment().tz("America/Guatemala").format(),
                    document: check.no,
                    details: `Pago de cheque a nombre de ${check.name} con fecha: ${moment(check.date).tz("America/Guatemala").format('DD/MM/yyyy')}`,
                    credit: 0,
                    debit: check.amount,
                    balance: 0,
                    type: 'Cheque'
                })

                await UPDATE_BANK_BALANCE(NEW_BANK_FLOW)
            }
            if (BODY.voided || BODY.state === 'RECHAZADO') {
                // Si el cheque es anulado o rechazado
                // Entonces eliminamos los balances de cada balances con el cheque
                // para regresear las cuentas a pendientes de pago
                await REMOVE_ACCOUNTS_PAYABLE(BODY);
                await REMOVE_CASH_REQUISITIONS(BODY);
            }
            res.status(200).json({
                ok: true,
                check
            });
        });
    });
});

CHECK_ROUTER.post('/', mdAuth, (req: Request, res: Response) => {
    const BODY: ICheck = req.body;

    const {
        _user,
        _bankAccount,
        no,
        city,
        date,
        name,
        amount,
        note,
        accountsPayables,
        cashRequisitions,
        state
    } = BODY;

    const newCheck = new Check({
        _user,
        _bankAccount,
        no,
        city,
        date,
        name,
        amount,
        note,
        accountsPayables,
        cashRequisitions,
        state,
        created: moment().tz("America/Guatemala").format(),
    });

    newCheck
        .save()
        .then(async (check) => {
            await PUSH_ACCOUNTS_PAYABLE(check)
            await UPDATE_CASH_REQUISITIONS(check)
            res.status(200).json({
                ok: true,
                check,
            });
        })
        .catch((err) => {
            res.status(400).json({
                ok: false,
                mensaje: 'Error al crear cheque',
                errors: err,
            });
        });
});

const PUSH_ACCOUNTS_PAYABLE = async (_check: ICheck): Promise<any> => {
    return Promise.all(
        _check.accountsPayables.map(async (_id: IAccountsPayable) => {

            const BALANCE: any = {
                _check,
                date: moment().tz("America/Guatemala").format(),
                document: _check.no,
                credit: 'CHEQUE',
                amount: _check.amount,
                file: ''
            }

            return AccountsPayable.findByIdAndUpdate(_id, {
                $push: { balance: BALANCE }
            }).exec()
        })
    );
};

const UPDATE_CASH_REQUISITIONS = async (_check: ICheck): Promise<any> => {
    return Promise.all(
        _check.cashRequisitions.map(async (_id: ICashRequisition) => CashRequisition.findByIdAndUpdate(_id, {
            _check: _check._id,
            updated: moment().tz("America/Guatemala").format(),
        }).exec())
    );
};

const REMOVE_ACCOUNTS_PAYABLE = async (_check: ICheck): Promise<any> => {
    return Promise.all(
        _check.accountsPayables.map(async (accountsPayable: IAccountsPayable) => {

            accountsPayable.balance = accountsPayable.balance.filter(b => b._check !== _check._id);

            return AccountsPayable.findByIdAndUpdate(accountsPayable._id, {
                balance: accountsPayable.balance,
            }).exec()
        })
    );
};

const REMOVE_CASH_REQUISITIONS = async (_check: ICheck): Promise<any> => {
    return Promise.all(
        _check.cashRequisitions.map(async (cashRequisition: ICashRequisition) => CashRequisition.findByIdAndUpdate(cashRequisition._id, {
            _check: null
        }).exec())
    );
};

const PAY_ACCOUNTS_PAYABLE = async (_check: ICheck): Promise<any> => {
    return Promise.all(
        _check.accountsPayables.map(async (accountsPayable: IAccountsPayable) => {

            const BALANCE = accountsPayable.balance.find(b => b._check === _check._id);

            if (BALANCE && accountsPayable.type === 'PRODUCTOS') {
                await UPDATE_BALANCE(accountsPayable._provider, BALANCE.amount, 'RESTA');
            }

            return AccountsPayable.findByIdAndUpdate(accountsPayable._id, {
                paid: true,
            }).exec()
        })
    );
};

const PAY_CASH_REQUISITIONS = async (_check: ICheck): Promise<any> => {
    return Promise.all(
        _check.cashRequisitions.map(async (cashRequisition: ICashRequisition) => {

            let balance = 0

            // Sumamos los ingresos
            balance = await UPDATE_CASH_BALANCE(cashRequisition._cash, cashRequisition.total)

            const NEW_CASH_FLOW = new CashFlow({
                _user: _check._user,
                _cash: cashRequisition._cash,
                date: moment().tz("America/Guatemala").format(),
                noBill: _check.no,
                details: `Pago de requisición`,
                state: 'SOLICITADO',
                income: cashRequisition.total,
                expense: 0,
                balance,
                created: moment().tz("America/Guatemala").format(),
            })

            await NEW_CASH_FLOW.save().then()

            // Actualizamos el estado de los movimientos a pagados
            await UPDATE_CASH_FLOWS(cashRequisition)


            return CashRequisition.findByIdAndUpdate(cashRequisition._id, {
            paid: true,
        }).exec()
})
    );
};

const UPDATE_CASH_FLOWS = async (cashRequisition: ICashRequisition): Promise<any> =>
    Promise.all(
        cashRequisition._cashFlows.map(async (_id: ICashFlow) => CashFlow.findByIdAndUpdate(_id, {
            state: 'PAGADO',
            updated: moment().tz("America/Guatemala").format(),
        }).exec())
    );

export default CHECK_ROUTER;
