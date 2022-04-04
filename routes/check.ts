import { Router, Request, Response } from 'express';
import moment from 'moment-timezone';

import { mdAuth } from '../middleware/auth'
import Check, { ICheck } from '../models/check';
import AccountsPayable, { IAccountsPayable, IAccountsPayableBalance } from '../models/accountsPayable';

const CHECK_ROUTER = Router();

/* #region  GET */
CHECK_ROUTER.get('/today', mdAuth, (req: Request, res: Response) => {

    const DATE = new Date();
    const MONTH = DATE.getUTCMonth() + 1; //months from 1-12
    const YEAR = DATE.getUTCFullYear();
    const DAY = DATE.getUTCDate();

    Check.find(
        {
            date: new Date(`${YEAR}, ${MONTH}, ${DAY}`),
            voided: false
        }
    )
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
/* #endregion */

CHECK_ROUTER.put('/:id', mdAuth, (req: Request, res: Response) => {
    const ID = req.params.id;
    const BODY: ICheck = req.body;

    Check.findByIdAndUpdate(ID, {
        no: BODY.no,
        city: BODY.city,
        date: BODY.date,
        name: BODY.name,
        amount: BODY.amount,
        note: BODY.note,
        receipt: BODY.receipt,
        accountsPayables: BODY.accountsPayables,
        paymentDate: BODY.paymentDate,
        state: BODY.state,
    },
        {
            new: true
        })
        .then((check: ICheck | null) => {
            res.status(200).json({
                ok: true,
                check
            });
        })
        .catch((err: any) => {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al actualizar cheque',
                errors: err
            });
        })
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
            await UPDATE_ACCOUNTS_PAYABLE(check)
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

const UPDATE_ACCOUNTS_PAYABLE = async (_check: ICheck): Promise<any> => {
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

export default CHECK_ROUTER;
