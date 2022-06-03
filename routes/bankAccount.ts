import { Router, Request, Response } from 'express';
import moment from 'moment-timezone';

import { mdAuth } from '../middleware/auth';
import BankAccount, { IBankAccount } from '../models/bankAccount';
import { CREATE_LOG_DELETE } from '../functions/logDelete';
import { CREATE_FLOW } from '../functions/bank';
import CashFlow from '../models/bankFlow';

const BANK_ACCOUNT_ROUTER = Router();

BANK_ACCOUNT_ROUTER.get('/', mdAuth, (req: Request, res: Response) => {
    BankAccount.find({
        _logDelete: null,
    })
        .populate('_bank')
        .sort({ no: 1 })
        .exec((err, bankAccounts) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando cuentas bancarias',
                    errors: err,
                });
            }

            res.status(200).json({
                ok: true,
                bankAccounts,
            });
        });
});

BANK_ACCOUNT_ROUTER.put('/:id', mdAuth, (req: Request, res: Response) => {
    const ID: string = req.params.id;
    const BODY: IBankAccount = req.body;

    const {
        no,
        name,
        type
    } = BODY;

    BankAccount.findByIdAndUpdate(ID, {
        no,
        name,
        type
    },
        {
            new: true
        })
        .then((bankAccount: IBankAccount | null) => {
            res.status(200).json({
                ok: true,
                bankAccount
            });
        })
        .catch((err: any) => {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al actualizar cuenta bancaria',
                errors: err
            });
        })
})

BANK_ACCOUNT_ROUTER.delete('/:id', mdAuth, (req: any, res: Response) => {
    const ID: string = req.params.id;
    const DETAILS: string = req.query.details;

    BankAccount.findById(ID, async (err, bankAccount) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar cuenta bancaria',
                errors: err,
            });
        }

        if (!bankAccount) {
            return res.status(400).json({
                ok: false,
                mensaje: 'La cuenta bancaria con el id' + ID + ' no existe',
                errors: {
                    message: 'No existe una cuenta bancaria con ese ID',
                },
            });
        }

        const LOG_DELETE = await CREATE_LOG_DELETE(req.user, `Cuenta bancaria - ${bankAccount?.no} - ${bankAccount?.name}`, DETAILS);

        bankAccount._logDelete = LOG_DELETE;

        bankAccount.save((err, bankAccount) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al borrar cuenta bancaria',
                    errors: err,
                });
            }

            res.status(200).json({
                ok: true,
                bankAccount,
            });
        });
    });
})

BANK_ACCOUNT_ROUTER.post('/', mdAuth, (req: Request, res: Response) => {
    const BODY: IBankAccount = req.body

    const {
        _bank,
        no,
        name,
        balance,
        type
    } = BODY;

    const NEW_BANK_ACCOUNT = new BankAccount({
        _bank,
        no,
        name,
        balance,
        type
    })

    NEW_BANK_ACCOUNT.save()
        .then(async (bankAccount: IBankAccount) => {

            const NEW_BANK_FLOW = new CashFlow({
                _bankAccount: bankAccount,
                date: moment().tz("America/Guatemala").format(),
                details: `APERTURA DE CUENTA`,
                credit: bankAccount.balance,
                debit: 0,
                balance: bankAccount.balance,
                type: 'Deposito'
            })

            await CREATE_FLOW(NEW_BANK_FLOW)

            BankAccount.populate(bankAccount, { path: "_bank" }, function (err, bankAccount) {
                res.status(200).json({
                    ok: true,
                    bankAccount,
                });
            });
        })
        .catch(err => {
            res.status(400).json({
                ok: false,
                mensaje: 'Error al crear cuenta bancaria',
                errors: err,
            });
        })
})

export default BANK_ACCOUNT_ROUTER;