import { Router, Request, Response } from 'express';
import { mdAuth } from '../middleware/auth'

import Purchase from '../models/purchase';
import Storage from '../models/storage';
import Provider from '../models/provider';
import { IPurchase, IPurchaseDetail } from '../models/purchase';
import { ICellar } from '../models/cellar';

const PURCHASE_ROUTER = Router();

/* #region  GET */
PURCHASE_ROUTER.get('/:_cellar', mdAuth, (req: Request, res: Response) => {
    const mes: number = Number(req.query.month);
    let mes2 = 0;
    let año: number = Number(req.query.year);
    let año2: number = Number(req.query.year);
    const _cellar = req.params._cellar;

    if (mes == 12) {
        mes2 = 1;
        año2 = año + 1;
    } else {
        mes2 = mes + 1;
    }

    Purchase.find(
        {
            _cellar,
            date: {
                $gte: new Date(año + ',' + mes),
                $lt: new Date(año2 + ',' + mes2),
            },
            deleted: false
        }
    )
        .sort({
            date: -1
        })
        .populate('_user', '')
        .populate('_provider', '')
        .populate('detail._product', '')
        .populate('adjust._user', '')
        .populate('adjust._product', '')
        .exec(async (err: any, purchases: IPurchase[]) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando compras',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                purchases
            });
        });
});
/* #endregion */

/* #region  GET */
PURCHASE_ROUTER.get('/deletes/:_cellar', mdAuth, (req: Request, res: Response) => {
    const mes: number = Number(req.query.month);
    let mes2 = 0;
    let año: number = Number(req.query.year);
    let año2: number = Number(req.query.year);
    const _cellar = req.params._cellar;

    if (mes == 12) {
        mes2 = 1;
        año2 = año + 1;
    } else {
        mes2 = mes + 1;
    }

    Purchase.find(
        {
            _cellar,
            date: {
                $gte: new Date(año + ',' + mes),
                $lt: new Date(año2 + ',' + mes2),
            },
            deleted: true
        }
    )
        .sort({
            date: -1
        })
        .populate('_user', '')
        .populate('_provider', '')
        .populate('detail._product', '')
        .populate('adjust._user', '')
        .populate('adjust._product', '')
        .populate('_userDeleted', '')
        .exec(async (err: any, purchases: IPurchase[]) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando compras',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                purchases
            });
        });
});
/* #endregion */

/* #region  DELETE */
PURCHASE_ROUTER.put('/delete/:id', mdAuth, (req: Request, res: Response) => {
    const ID = req.params.id;
    const BODY = req.body;

    Purchase.findById(ID, (err, purchase) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar compra',
                errors: err
            });
        }

        if (!purchase) {
            return res.status(400).json({
                ok: false,
                mensaje: 'La compra con el id' + ID + ' no existe',
                errors: {
                    message: 'No existe una compra con ese ID'
                }
            });
        }

        purchase._userDeleted = BODY._userDeleted;
        purchase.textDeleted = BODY.textDeleted;
        purchase.deleted = true;

        purchase.save((err, purchase) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al borrar compra',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                purchase
            });
        });
    })

});
/* #endregion */

/* #region  POST cellar */
PURCHASE_ROUTER.post('/', mdAuth, async (req: Request, res: Response) => {
    const BODY = req.body;

    BODY.detail = await searchPrices(BODY._cellar, BODY.detail);

    Provider.findOne({
        name: BODY._provider,
        deleted: false
    }).exec(async (err, _provider) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar proveedor',
                errors: err,
            });
        }

        if (!_provider) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al buscar proveedor',
                errors: err,
            });
        }

        const newPurchase = new Purchase({
            _cellar: BODY._cellar,
            _user: BODY._user,
            _provider: _provider,
            noBill: BODY.noBill,
            date: BODY.date,
            requisition: BODY.requisition,
            details: BODY.details,
            detail: BODY.detail,
            payment: BODY.payment,
            total: BODY.total,
            file: BODY.file,
        });

        newPurchase
            .save()
            .then((purchase) => {
                res.status(200).json({
                    ok: true,
                    purchase,
                });
            })
            .catch((err) => {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al crear compra',
                    errors: err,
                });
            });
    });
});
/* #endregion */

const searchPrices = async (_cellar: ICellar, detail: IPurchaseDetail[]): Promise<any> => {
    return Promise.all(
        detail.map(async (element: IPurchaseDetail) => {

            const STORAGE = await Storage.findOne(
                {
                    _cellar: _cellar._id,
                    _product: element._product
                }
            ).exec();

            if (STORAGE) {
                const diff: number = (element.cost - STORAGE.cost);
                const percent: number = (diff / STORAGE.cost) * 100;

                element.changedPrice = percent;
            } else {
                const NEW_STORAGE = new Storage({
                    _cellar,
                    _product: element._product,
                    minStock: 10,
                    maxStock: 30,
                    cost: element.cost,
                    totalStock: 0,
                    reserve: 0,
                    state: ''//TODO: Agregar state por defecto
                });

                await NEW_STORAGE.save().then();

                element.changedPrice = 0;
            }

            return {
                ...element,
            };
        })
    );
};

export default PURCHASE_ROUTER;
