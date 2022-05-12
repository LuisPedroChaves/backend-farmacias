import { Router, Request, Response } from 'express';
import { FilterQuery } from 'mongoose';
import { mdAuth } from '../middleware/auth';
import AccountsPayable, { IAccountsPayable } from '../models/accountsPayable';
import { UPDATE_BALANCE } from '../functions/provider';
import { CREATE_LOG_DELETE } from '../functions/logDelete';

const ACCOUNTS_PAYABLE_ROUTER = Router();

/* #region  GET */
ACCOUNTS_PAYABLE_ROUTER.get('/unpaids', mdAuth, (req: Request, res: Response) => {
    AccountsPayable.find(
        {
            paid: false,
            deleted: false
        }
    )
        .populate('_expense')
        .populate('_user')
        .populate('_provider')
        .populate('_purchase')
        .populate('balance._check')
        .populate('deletedBalance._check')
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

ACCOUNTS_PAYABLE_ROUTER.get('/tempCredits', mdAuth, (req: Request, res: Response) => {
    AccountsPayable.find(
        {
            docType: 'CREDITO_TEMP',
            deleted: false
        }
    )
        .populate('_expense')
        .populate('_user')
        .populate('_provider')
        .populate('_purchase')
        .populate('balance._check')
        .populate('deletedBalance._check')
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
})

ACCOUNTS_PAYABLE_ROUTER.get('/expenses', mdAuth, (req: Request, res: Response) => {
    let startDate = new Date(String(req.query.startDate));
    let endDate = new Date(String(req.query.endDate));
    endDate.setDate(endDate.getDate() + 1); // Sumamos un día para aplicar bien el filtro

    let conditions: FilterQuery<IAccountsPayable> = {
        date: {
            $gte: new Date(startDate.toDateString()),
            $lt: new Date(endDate.toDateString()),
        },
        type: 'GASTOS',
        paid: true,
        deleted: false
    };

    AccountsPayable.find(
        conditions
    )
        .populate('_expense')
        .populate('_user')
        .populate('_provider')
        .populate('_purchase')
        .populate('balance._check')
        .sort({
            _expense: 1
        })
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

ACCOUNTS_PAYABLE_ROUTER.get('/history/:_provider', mdAuth, (req: Request, res: Response) => {
    const _provider = req.params._provider;
    let startDate = new Date(String(req.query.startDate));
    let endDate = new Date(String(req.query.endDate));
    endDate.setDate(endDate.getDate() + 1); // Sumamos un día para aplicar bien el filtro

    let conditions: FilterQuery<IAccountsPayable> = {
        date: {
            $gte: new Date(startDate.toDateString()),
            $lt: new Date(endDate.toDateString()),
        },
        deleted: false
    };

    if (_provider !== 'null') {
        conditions = {
            _provider,
            date: {
                $gte: new Date(startDate.toDateString()),
                $lt: new Date(endDate.toDateString()),
            },
            deleted: false
        }
    }

    AccountsPayable.find(
        conditions
    )
        .populate('_expense')
        .populate('_user')
        .populate('_provider')
        .populate('_purchase')
        .populate('balance._check')
        .populate('deletedBalance._check')
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

ACCOUNTS_PAYABLE_ROUTER.get('/report/:_provider', mdAuth, (req: Request, res: Response) => {
    const _provider = req.params._provider;
    let startDate = new Date(String(req.query.startDate));
    let endDate = new Date(String(req.query.endDate));
    endDate.setDate(endDate.getDate() + 1); // Sumamos un día para aplicar bien el filtro

    let conditions: FilterQuery<IAccountsPayable> = {
        _provider,
        date: {
            $gte: new Date(startDate.toDateString()),
            $lt: new Date(endDate.toDateString()),
        },
        paid: true,
        deleted: false
    };

    AccountsPayable.find(
        conditions
    )
        .populate('_expense')
        .populate('_user')
        .populate('_provider')
        .populate('_purchase')
        .populate('balance._check')
        .sort({
            date: 1
        })
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
/* #endregion */

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
        deletedBalance,
        unaffectedAmount,
        exemptAmount,
        netPurchaseAmount,
        netServiceAmount,
        otherTaxes,
        iva,
        total,
        type,
        file,
        emptyWithholdingIVA,
        emptyWithholdingISR,
        additionalDiscount,
        toCredit,
        expirationCredit,
        paid,
    }: IAccountsPayable = BODY;

    AccountsPayable.findByIdAndUpdate(ID, {
        _provider,
        _purchase,
        _expense,
        date,
        serie: serie.toUpperCase(),
        noBill: noBill.toUpperCase(),
        docType,
        balance,
        deletedBalance,
        unaffectedAmount,
        exemptAmount,
        netPurchaseAmount,
        netServiceAmount,
        otherTaxes,
        iva,
        total,
        type,
        file,
        emptyWithholdingIVA,
        emptyWithholdingISR,
        additionalDiscount,
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

ACCOUNTS_PAYABLE_ROUTER.delete('/:id', mdAuth, (req: any, res: Response) => {
    const ID: string = req.params.id;
    const DETAILS: string = req.query.details;

    AccountsPayable.findById(ID, async (err, accountsPayable) => {
        if (err) {
			return res.status(500).json({
				ok: false,
				mensaje: 'Error al buscar documento',
				errors: err,
			});
		}

		if (!accountsPayable) {
			return res.status(400).json({
				ok: false,
				mensaje: 'El documento con el id' + ID + ' no existe',
				errors: {
					message: 'No existe un documento con ese ID',
				},
			});
		}

        const LOG_DELETE = await CREATE_LOG_DELETE(req.user, `Cuenta por pagar - Documento: ${accountsPayable?.serie} ${accountsPayable?.noBill}`, DETAILS);

		accountsPayable.deleted = true;
        accountsPayable._logDelete = LOG_DELETE;

		accountsPayable.save((err, accountsPayable) => {
			if (err) {
				return res.status(400).json({
					ok: false,
					mensaje: 'Error al borrar documento',
					errors: err,
				});
			}

			res.status(200).json({
				ok: true,
				accountsPayable,
			});
		});
    });
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
        deletedBalance,
        unaffectedAmount,
        exemptAmount,
        netPurchaseAmount,
        netServiceAmount,
        otherTaxes,
        iva,
        total,
        type,
        file,
        emptyWithholdingIVA,
        emptyWithholdingISR,
        additionalDiscount,
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
        serie: serie.toUpperCase(),
        noBill: noBill.toUpperCase(),
        docType,
        balance,
        deletedBalance,
        unaffectedAmount,
        exemptAmount,
        netPurchaseAmount,
        netServiceAmount,
        otherTaxes,
        iva,
        total,
        type,
        file,
        emptyWithholdingIVA,
        emptyWithholdingISR,
        additionalDiscount,
        toCredit,
        expirationCredit,
        paid,
    })

    NEW_ACCOUNTS_PAYABLE.save()
        .then(async (accountsPayable: IAccountsPayable) => {
            let action = 'SUMA';
            if (accountsPayable.docType === 'ABONO' || accountsPayable.docType === 'CREDITO' || accountsPayable.docType === 'CREDITO_TEMP') {
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