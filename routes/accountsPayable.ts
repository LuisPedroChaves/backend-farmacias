import { Router, Request, Response } from 'express';
import mongoose, { FilterQuery } from 'mongoose';
import fileUpload from 'express-fileupload';
import xlsx from 'node-xlsx';
import bluebird from 'bluebird';
import moment from 'moment-timezone';
import { getUploadPath } from '../config/paths';

import { mdAuth } from '../middleware/auth';
import AccountsPayable, { IAccountsPayable } from '../models/accountsPayable';
import { UPDATE_BALANCE } from '../functions/provider';
import { CREATE_LOG_DELETE } from '../functions/logDelete';
import Provider from '../models/provider'

const ACCOUNTS_PAYABLE_ROUTER = Router();
ACCOUNTS_PAYABLE_ROUTER.use(fileUpload());

// ABONO no es un documento facturado sino un pago parcial, no aplica para detectar duplicados
const DOC_TYPES_EXCLUDED_FROM_DUPLICATE_CHECK = ['ABONO'];

/**
 * Busca un documento activo (no anulado/eliminado) con el mismo proveedor, serie y número
 * de factura. Se usa tanto al crear como al editar para prevenir duplicados.
 */
const FIND_DUPLICATE_DOCUMENT = (
    _provider: string,
    serie: string,
    noBill: string,
    docType: string,
    excludeId?: string
) => {
    if (DOC_TYPES_EXCLUDED_FROM_DUPLICATE_CHECK.includes(docType)) {
        return Promise.resolve(null);
    }

    const conditions: FilterQuery<IAccountsPayable> = {
        _provider,
        serie: serie?.toUpperCase(),
        noBill: noBill?.toUpperCase(),
        docType: { $nin: DOC_TYPES_EXCLUDED_FROM_DUPLICATE_CHECK },
        deleted: false,
    };

    if (excludeId) {
        conditions._id = { $ne: excludeId };
    }

    return AccountsPayable.findOne(conditions).exec();
};

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

// Condición de agregación que evalúa si un documento tiene retenciones pendientes
// según las reglas del proveedor (requiere _provider ya resuelto vía $lookup)
const WITHHOLDINGS_AGGREGATION_CONDITION = {
    $or: [
        {
            $and: [
                { $eq: ['$_provider.iva', true] },
                { $eq: ['$emptyWithholdingIVA', true] },
            ],
        },
        {
            $and: [
                { $eq: ['$_provider.isr', true] },
                { $eq: ['$emptyWithholdingISR', true] },
            ],
        },
    ],
};

// Construye el pipeline base compartido por /unpaids/paged y /unpaids/counts,
// para que ambos apliquen exactamente el mismo criterio por pestaña y nunca diverjan.
// query: subconjunto de req.query (type, _provider, withholdings, pending, search, docType, expired)
const BUILD_UNPAIDS_PIPELINE = (query: Record<string, any>): any[] => {
    const { type, _provider, withholdings, pending, search, docType, expired } = query;

    const match: Record<string, any> = {
        paid: false,
        deleted: false,
    };

    if (type === 'PRODUCTOS' || type === 'GASTOS') {
        match.type = type;
    }

    if (docType) {
        match.docType = String(docType);
    }

    if (_provider) {
        match._provider = new mongoose.Types.ObjectId(String(_provider));
    }

    if (pending === 'true') {
        match['balance.credit'] = { $ne: 'CHEQUE' };
    } else if (pending === 'false') {
        match['balance.credit'] = 'CHEQUE';
    }

    if (expired === 'true') {
        match.expirationCredit = { $lt: new Date() };
    }

    const pipeline: any[] = [
        { $match: match },
        {
            $lookup: {
                from: 'providers',
                localField: '_provider',
                foreignField: '_id',
                as: '_provider',
            },
        },
        { $unwind: '$_provider' },
    ];

    if (withholdings === 'true') {
        pipeline.push({
            $match: {
                $expr: WITHHOLDINGS_AGGREGATION_CONDITION,
            },
        });
    }

    if (search) {
        const REGEX = new RegExp(String(search), 'i');
        pipeline.push({
            $match: {
                $or: [
                    { serie: REGEX },
                    { noBill: REGEX },
                    { '_provider.name': REGEX },
                    { '_provider.nit': REGEX },
                ],
            },
        });
    }

    return pipeline;
};

ACCOUNTS_PAYABLE_ROUTER.get('/unpaids/paged', mdAuth, async (req: Request, res: Response) => {
    try {
        const PAGE = Math.max(0, parseInt(String(req.query.page), 10) || 0);
        const SIZE = Math.min(500, Math.max(1, parseInt(String(req.query.size), 10) || 50));

        const pipeline = BUILD_UNPAIDS_PIPELINE(req.query as Record<string, any>);

        pipeline.push(
            { $sort: { date: -1 } },
            {
                $facet: {
                    data: [
                        { $skip: PAGE * SIZE },
                        { $limit: SIZE },
                    ],
                    total: [
                        { $count: 'count' },
                    ],
                },
            },
        );

        const RESULT = await AccountsPayable.aggregate(pipeline).exec();

        const IDS = (RESULT[0]?.data || []).map((doc: any) => doc._id);
        const TOTAL = RESULT[0]?.total[0]?.count || 0;

        // Repoblamos usando find + populate con proyección para mantener el mismo
        // formato de documentos que el resto de la API (Mongoose documents, no POJOs)
        const ACCOUNTS_PAYABLES = await AccountsPayable.find({ _id: { $in: IDS } })
            .populate('_provider', 'name nit iva isr checkName')
            .populate('_user', 'name')
            .populate('balance._check', 'no date state')
            .populate('deletedBalance._check', 'no date state')
            .sort({ date: -1 })
            .exec();

        res.status(200).json({
            ok: true,
            accountsPayables: ACCOUNTS_PAYABLES,
            total: TOTAL,
        });
    } catch (err) {
        return res.status(500).json({
            ok: false,
            mensaje: 'Error listando cuentas por pagar',
            errors: err,
        });
    }
});

// Cuenta cuántos documentos matchean el mismo pipeline que usaría /unpaids/paged
// con estos query params (garantiza que counts.X === paged?<mismos params>.total).
const COUNT_UNPAIDS = async (query: Record<string, any>): Promise<number> => {
    const pipeline = BUILD_UNPAIDS_PIPELINE(query);
    pipeline.push({ $count: 'count' });
    const RESULT = await AccountsPayable.aggregate(pipeline).exec();
    return RESULT[0]?.count || 0;
};

ACCOUNTS_PAYABLE_ROUTER.get('/unpaids/counts', mdAuth, async (req: Request, res: Response) => {
    try {
        const { search } = req.query;

        const [withholdings, products, expenses, tempCredits] = await Promise.all([
            COUNT_UNPAIDS({ withholdings: 'true', search }),
            COUNT_UNPAIDS({ type: 'PRODUCTOS', search }),
            COUNT_UNPAIDS({ type: 'GASTOS', search }),
            COUNT_UNPAIDS({ docType: 'CREDITO_TEMP', search }),
        ]);

        res.status(200).json({
            ok: true,
            counts: {
                withholdings,
                products,
                expenses,
                tempCredits,
            },
        });
    } catch (err) {
        return res.status(500).json({
            ok: false,
            mensaje: 'Error contando cuentas por pagar',
            errors: err,
        });
    }
});

ACCOUNTS_PAYABLE_ROUTER.get('/provider/:_provider/totals', mdAuth, async (req: Request, res: Response) => {
    try {
        const _PROVIDER = new mongoose.Types.ObjectId(req.params._provider);
        const NOW = new Date();

        const RESULT = await AccountsPayable.aggregate([
            { $match: { _provider: _PROVIDER, paid: false, deleted: false } },
            {
                $lookup: {
                    from: 'providers',
                    localField: '_provider',
                    foreignField: '_id',
                    as: '_provider',
                },
            },
            { $unwind: '$_provider' },
            {
                $addFields: {
                    checkedAmount: {
                        $sum: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$balance',
                                        cond: { $eq: ['$$this.credit', 'CHEQUE'] },
                                    },
                                },
                                in: '$$this.amount',
                            },
                        },
                    },
                    hasCheque: {
                        $gt: [
                            {
                                $size: {
                                    $filter: {
                                        input: '$balance',
                                        cond: { $eq: ['$$this.credit', 'CHEQUE'] },
                                    },
                                },
                            },
                            0,
                        ],
                    },
                },
            },
            {
                $facet: {
                    bills: [
                        { $match: { docType: { $nin: ['ABONO', 'CREDITO', 'CREDITO_TEMP'] } } },
                        { $group: { _id: null, sum: { $sum: { $subtract: ['$total', '$checkedAmount'] } } } },
                    ],
                    credits: [
                        { $match: { docType: 'ABONO' } },
                        { $group: { _id: null, sum: { $sum: '$total' } } },
                    ],
                    creditNotes: [
                        { $match: { docType: { $in: ['CREDITO', 'CREDITO_TEMP'] } } },
                        { $group: { _id: null, sum: { $sum: '$total' } } },
                    ],
                    pending: [
                        { $match: { hasCheque: false } },
                        { $count: 'count' },
                    ],
                    inProcess: [
                        { $match: { hasCheque: true } },
                        { $count: 'count' },
                    ],
                    withholdings: [
                        { $match: { hasCheque: false, $expr: WITHHOLDINGS_AGGREGATION_CONDITION } },
                        { $count: 'count' },
                    ],
                    expired: [
                        { $match: { hasCheque: false, expirationCredit: { $lt: NOW } } },
                        { $count: 'count' },
                    ],
                },
            },
        ]).exec();

        const FACET = RESULT[0] || {};

        res.status(200).json({
            ok: true,
            totals: {
                bills: FACET.bills?.[0]?.sum || 0,
                credits: FACET.credits?.[0]?.sum || 0,
                creditNotes: FACET.creditNotes?.[0]?.sum || 0,
                pending: FACET.pending?.[0]?.count || 0,
                inProcess: FACET.inProcess?.[0]?.count || 0,
                withholdings: FACET.withholdings?.[0]?.count || 0,
                expired: FACET.expired?.[0]?.count || 0,
            },
        });
    } catch (err) {
        return res.status(500).json({
            ok: false,
            mensaje: 'Error calculando totales del proveedor',
            errors: err,
        });
    }
});

// TEMPORAL: diagnóstico de documentos pendientes cuyo balance ya cubre el total
// pero nunca se marcaron como paid=true. Solo lectura, no modifica datos.
// Eliminar esta ruta una vez completado el diagnóstico.
ACCOUNTS_PAYABLE_ROUTER.get('/diagnostics/coveredButUnpaid', mdAuth, async (req: Request, res: Response) => {
    try {
        const RESULT = await AccountsPayable.aggregate([
            { $match: { paid: false, deleted: false } },
            {
                $addFields: {
                    balanceSum: { $sum: '$balance.amount' },
                },
            },
            {
                $match: {
                    $expr: { $gte: ['$balanceSum', '$total'] },
                },
            },
            { $sort: { date: 1 } },
            {
                $facet: {
                    count: [{ $count: 'count' }],
                    oldest: [
                        { $limit: 20 },
                        {
                            $project: {
                                _id: 1,
                                _provider: 1,
                                serie: 1,
                                noBill: 1,
                                date: 1,
                                total: 1,
                                balanceSum: 1,
                            },
                        },
                    ],
                },
            },
        ]).exec();

        res.status(200).json({
            ok: true,
            count: RESULT[0]?.count[0]?.count || 0,
            oldest: RESULT[0]?.oldest || [],
        });
    } catch (err) {
        return res.status(500).json({
            ok: false,
            mensaje: 'Error en diagnóstico de documentos pendientes',
            errors: err,
        });
    }
});

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

// IMPORTANTE: esta ruta debe ir antes de '/report/:_provider', de lo contrario
// Express interpreta "duplicates" como el parámetro dinámico _provider
ACCOUNTS_PAYABLE_ROUTER.get('/report/duplicates', mdAuth, (req: Request, res: Response) => {
    const { startDate, endDate, _provider } = req.query;

    let match: FilterQuery<IAccountsPayable> = {
        deleted: false,
        // ABONO no es un documento facturado sino un pago parcial, no aplica para detectar duplicados
        docType: { $ne: 'ABONO' },
    };

    if (startDate && endDate) {
        let START_DATE = new Date(String(startDate));
        let END_DATE = new Date(String(endDate));

        if (!isNaN(START_DATE.getTime()) && !isNaN(END_DATE.getTime())) {
            END_DATE.setDate(END_DATE.getDate() + 1); // Sumamos un día para aplicar bien el filtro

            match.date = {
                $gte: new Date(START_DATE.toDateString()),
                $lt: new Date(END_DATE.toDateString()),
            };
        }
    }

    if (_provider) {
        match._provider = _provider;
    }

    const PAGE = Number(req.query.page) || 0;
    const SIZE = Number(req.query.size) || 10;

    AccountsPayable.aggregate([
        {
            $match: match,
        },
        {
            $group: {
                _id: {
                    _provider: '$_provider',
                    serie: '$serie',
                    noBill: '$noBill',
                },
                count: { $sum: 1 },
                lastDate: { $max: '$date' },
                documents: {
                    $push: {
                        _id: '$_id',
                        date: '$date',
                        total: '$total',
                        paid: '$paid',
                        docType: '$docType',
                        _purchase: '$_purchase',
                        _expense: '$_expense',
                    },
                },
            },
        },
        {
            $match: {
                count: { $gte: 2 },
            },
        },
        {
            $lookup: {
                from: 'providers',
                localField: '_id._provider',
                foreignField: '_id',
                as: '_provider',
            },
        },
        {
            $unwind: '$_provider',
        },
        {
            $project: {
                _id: 0,
                _provider: {
                    _id: '$_provider._id',
                    code: '$_provider.code',
                    nit: '$_provider.nit',
                    name: '$_provider.name',
                },
                serie: '$_id.serie',
                noBill: '$_id.noBill',
                count: 1,
                lastDate: 1,
                documents: 1,
            },
        },
        {
            // Los grupos con el duplicado más reciente primero
            $sort: {
                lastDate: -1,
            },
        },
        {
            $facet: {
                duplicates: [
                    { $skip: PAGE * SIZE },
                    { $limit: SIZE },
                ],
                total: [
                    { $count: 'count' },
                ],
            },
        },
    ])
        .then(result => {
            const duplicates = result[0].duplicates;
            const total = result[0].total[0]?.count || 0;

            res.status(200).json({
                ok: true,
                duplicates,
                total,
                page: PAGE,
                size: SIZE,
            });
        })
        .catch(err => {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error generando reporte de documentos duplicados',
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

ACCOUNTS_PAYABLE_ROUTER.put('/:id', mdAuth, async (req: Request, res: Response) => {
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

    const PROVIDER_ID = (_provider as any)?._id ?? _provider;

    const DUPLICATE = await FIND_DUPLICATE_DOCUMENT(String(PROVIDER_ID), serie, noBill, docType, ID);

    if (DUPLICATE) {
        return res.status(400).json({
            ok: false,
            mensaje: `Ya existe un documento activo con la serie ${serie.toUpperCase()} y número ${noBill.toUpperCase()} para este proveedor`,
            errors: { message: 'Documento duplicado' },
        });
    }

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

/* #region  POST */
ACCOUNTS_PAYABLE_ROUTER.post('/', mdAuth, async (req: Request, res: Response) => {
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

    const PROVIDER_ID = (_provider as any)?._id ?? _provider;

    const DUPLICATE = await FIND_DUPLICATE_DOCUMENT(String(PROVIDER_ID), serie, noBill, docType);

    if (DUPLICATE) {
        return res.status(400).json({
            ok: false,
            mensaje: `Ya existe un documento activo con la serie ${serie.toUpperCase()} y número ${noBill.toUpperCase()} para este proveedor`,
            errors: { message: 'Documento duplicado' },
        });
    }

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

ACCOUNTS_PAYABLE_ROUTER.post('/xlsx', mdAuth, (req: any, res: Response) => {
    // Sino envia ningún archivo
    if (!req.files) {
        return res.status(400).json({
            ok: false,
            mensaje: 'No Selecciono nada',
            errors: { message: 'Debe de seleccionar un archivo' }
        });
    }

    // Obtener nombre y la extensión del archivo
    const FILE: any = req.files.archivo;
    const NAME_FILE = FILE.name.split('.');
    const EXT_FILE = NAME_FILE[NAME_FILE.length - 1];

    // Nombre del archivo personalizado
    const NEW_NAME_FILE = `${new Date().getMilliseconds()}.${EXT_FILE}`;

    // Mover el archivo de la memoria temporal a un path
    const PATH = getUploadPath('temp', NEW_NAME_FILE);

    FILE.mv(PATH, async (err: any) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al mover archivo',
                errors: err
            });
        }

        const DOC = xlsx.parse(PATH);

        await bluebird.mapSeries(DOC[0].data, async (doc: any, index) => {
            try {

                const _provider = await Provider.findOne({
                    code: doc[0],
                    deleted: false
                }).exec();

                if (_provider) {
                    let total = doc[4];
                    total = parseFloat(total)

                    let date = new Date(moment(ExcelDateToJSDate(doc[1])).tz("America/Guatemala").format());

                    const NEW_ACCOUNTS_PAYABLE = new AccountsPayable({
                        _user: req.user,
                        _provider,
                        date,
                        serie: doc[2],
                        noBill: doc[3],
                        total,
                        toCredit: true,
                        docType: 'CREDITO'
                    });

                    let accountsPayable = await NEW_ACCOUNTS_PAYABLE
                        .save()
                        .then()

                    let action = 'RESTA';

                    await UPDATE_BALANCE(accountsPayable._provider, accountsPayable.total, action)

                } else {
                    console.log(doc[1]);
                    console.log(doc[3]);
                }
            } catch (e: any) {
                throw new Error(e.message);
            }
        });

        return res.status(201).json({
            ok: true,
            m: 'FACTURAS INGRESADAS'
        });
    });
});

ACCOUNTS_PAYABLE_ROUTER.post('/updatexlsx', (req: any, res: Response) => {
    // Sino envia ningún archivo
    if (!req.files) {
        return res.status(400).json({
            ok: false,
            mensaje: 'No Selecciono nada',
            errors: { message: 'Debe de seleccionar un archivo' }
        });
    }

    // Obtener nombre y la extensión del archivo
    const FILE: any = req.files.archivo;
    const NAME_FILE = FILE.name.split('.');
    const EXT_FILE = NAME_FILE[NAME_FILE.length - 1];

    // Nombre del archivo personalizado
    const NEW_NAME_FILE = `${new Date().getMilliseconds()}.${EXT_FILE}`;

    // Mover el archivo de la memoria temporal a un path
    const PATH = getUploadPath('temp', NEW_NAME_FILE);

    FILE.mv(PATH, async (err: any) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al mover archivo',
                errors: err
            });
        }

        const DOC = xlsx.parse(PATH);

        await bluebird.mapSeries(DOC[0].data, async (doc: any, index) => {
            try {

                const accountsPayable = await AccountsPayable.findOne({
                    noBill: doc[3],
                    deleted: false
                }).exec();

                if (accountsPayable) {

                    let total = doc[4];
                    total = parseFloat(total)

                    let date = new Date(moment(ExcelDateToJSDate(doc[1])).tz("America/Guatemala").format());

                    const updated = await AccountsPayable.findByIdAndUpdate(accountsPayable._id, {
                        date
                    }).then()

                } else {
                    console.log(doc[1]);
                    console.log(doc[3]);
                }
            } catch (e: any) {
                throw new Error(e.message);
            }
        });

        return res.status(201).json({
            ok: true,
            m: 'FACTURAS EDITADAS'
        });
    });
});
/* #endregion */

const ExcelDateToJSDate = (serialXlsx: number) => {
    var utc_days = Math.floor(serialXlsx - 25568);
    var utc_value = utc_days * 86400;
    var date_info = new Date(utc_value * 1000);

    var fractional_day = serialXlsx - Math.floor(serialXlsx) + 0.0000001;

    var total_seconds = Math.floor(86400 * fractional_day);

    var seconds = total_seconds % 60;

    total_seconds -= seconds;

    var hours = Math.floor(total_seconds / (60 * 60));
    var minutes = Math.floor(total_seconds / 60) % 60;

    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
}

export default ACCOUNTS_PAYABLE_ROUTER;