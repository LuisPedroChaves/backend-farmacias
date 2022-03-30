import { Router, Request, Response } from 'express';

import { mdAuth } from '../middleware/auth';
import AccountsPayable, { IAccountsPayable } from '../models/accountsPayable';
import {UPDATE_BALANCE} from '../functions/provider';

const ACCOUNTS_PAYABLE_ROUTER = Router();

ACCOUNTS_PAYABLE_ROUTER.get('/unpaids', mdAuth, (req: Request, res: Response) => {
    AccountsPayable.find(
        {
            paid: false,
            deleted: false
        }
    )
        .populate('_user')
        .populate('_provider')
        .populate('_purchase')
        .populate('_expense')
        .populate('_check')
        .sort({})
        .then(accountsPayables => {
            res.status(200).json({
                ok: true,
                accountsPayables,
            });
        })
        .catch(err => {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error listando cuentas por pagar',
                errors: err,
            });
        })
});

ACCOUNTS_PAYABLE_ROUTER.put('/:id', mdAuth, (req: Request, res: Response) => {
    const ID: string = req.params.id;
    const BODY: IAccountsPayable = req.body;

    const {
        _provider,
        _purchase,
        _expense,
        date,
        serie,
        noBill,
        docType,
        balance,
        unaffectedAmount,
        exemptAmount,
        netPurchaseAmount,
        netServiceAmount,
        otherTaxes,
        iva,
        total,
        type,
        file,
        toCredit,
        expirationCredit,
        paid,
    }: IAccountsPayable = BODY;

    AccountsPayable.findByIdAndUpdate(ID, {
        _provider,
        _purchase,
        _expense,
        date,
        serie,
        noBill,
        docType,
        balance,
        unaffectedAmount,
        exemptAmount,
        netPurchaseAmount,
        netServiceAmount,
        otherTaxes,
        iva,
        total,
        type,
        file,
        toCredit,
        expirationCredit,
        paid,
    },
        {
            new: true
        })
        .then((accountsPayable: IAccountsPayable | null) => {
            res.status(200).json({
                ok: true,
                accountsPayable
            });
        })
        .catch((err: any) => {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al actualizar cuenta por pagar',
                errors: err
            });
        })
})

ACCOUNTS_PAYABLE_ROUTER.delete('/:id', mdAuth, (req: Request, res: Response) => {
    const ID: string = req.params.id;

    AccountsPayable.findByIdAndUpdate(ID, {
        deleted: true
    })
        .then((accountsPayable: IAccountsPayable | null) => {
            res.status(200).json({
                ok: true,
                accountsPayable
            });
        })
        .catch(err => {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al eliminar cuenta por pagar',
                errors: err
            });
        })
})

ACCOUNTS_PAYABLE_ROUTER.post('/', mdAuth, (req: Request, res: Response) => {
    const BODY: IAccountsPayable = req.body

    const {
        _user,
        _provider,
        _purchase,
        _expense,
        date,
        serie,
        noBill,
        docType,
        balance,
        unaffectedAmount,
        exemptAmount,
        netPurchaseAmount,
        netServiceAmount,
        otherTaxes,
        iva,
        total,
        type,
        file,
        toCredit,
        expirationCredit,
        paid,
    } = BODY;

    const NEW_ACCOUNTS_PAYABLE = new AccountsPayable({
        _user,
        _provider,
        _purchase,
        _expense,
        date,
        serie,
        noBill,
        docType,
        balance,
        unaffectedAmount,
        exemptAmount,
        netPurchaseAmount,
        netServiceAmount,
        otherTaxes,
        iva,
        total,
        type,
        file,
        toCredit,
        expirationCredit,
        paid,
    })

    NEW_ACCOUNTS_PAYABLE.save()
        .then(async (accountsPayable: IAccountsPayable) => {
            let action = 'SUMA';
            if (accountsPayable.docType === 'ABONO' || accountsPayable.docType === 'CREDITO') {
                action = 'RESTA';
            }

            if (!accountsPayable.paid) {
                // Solo si es cuenta al crédito
                await UPDATE_BALANCE(accountsPayable._provider, accountsPayable.total, action)
            }

            res.status(200).json({
                ok: true,
                accountsPayable,
            });
        })
        .catch(err => {
            res.status(400).json({
                ok: false,
                mensaje: 'Error al crear cuenta por pagar',
                errors: err,
            });
        })
})

export default ACCOUNTS_PAYABLE_ROUTER;