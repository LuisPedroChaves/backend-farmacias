import { Router, Request, Response } from 'express';
import moment from 'moment-timezone';

import { mdAuth } from '../middleware/auth'
import Check, { ICheck } from '../models/check';
import AccountsPayable, { IAccountsPayable } from '../models/accountsPayable';
import { UPDATE_BALANCE } from '../functions/provider';

const CHECK_ROUTER = Router();

/* #region  GET */
CHECK_ROUTER.get('/today', mdAuth, (req: Request, res: Response) => {

    const DATE = moment().tz("America/Guatemala");

    const MONTH = DATE.format('M');
    const YEAR = DATE.format('YYYY');
    const DAY = DATE.format('D');

    Check.find(
        {
            date: new Date(`${YEAR}, ${MONTH}, ${DAY}`),
            voided: false
        }
    )
        .populate('_user')
        .populate('accountsPayables')
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
        .populate('accountsPayables')
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
        .populate('accountsPayables')
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

        check.state = BODY.state
        check.paymentDate = BODY.paymentDate
        check.receipt.no = BODY.receipt.no
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
            }
            if (BODY.voided || BODY.state === 'RECHAZADO') {
                // Si el cheque es anulado o rechazado
                // Entonces eliminamos los balances de cada balances con el cheque
                // para regresear las cuentas a pendientes de pago
                await REMOVE_ACCOUNTS_PAYABLE(BODY);
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

    const newCheck = new Check({
        _user: BODY._user,
        no: BODY.no,
        city: BODY.city,
        date: BODY.date,
        name: BODY.name,
        amount: BODY.amount,
        note: BODY.note,
        accountsPayables: BODY.accountsPayables,
        bank: BODY.bank,
        state: BODY.state,
        created: moment().tz("America/Guatemala").format(),
    });

    newCheck
        .save()
        .then(async (check) => {
            await PUSH_ACCOUNTS_PAYABLE(check)
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

export default CHECK_ROUTER;
