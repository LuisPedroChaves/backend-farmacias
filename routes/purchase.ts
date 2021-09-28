import { Router, Request, Response } from 'express';
import { mdAuth } from '../middleware/auth'

import Purchase from '../models/purchase';
import Provider from '../models/provider';
import Product from '../models/product';
import { IPurchase, IPurchaseDetail } from '../models/purchase';

const PURCHASE_ROUTER = Router();

/* #region  GET */
PURCHASE_ROUTER.get('/:_cellar', mdAuth, (req: Request, res: Response) => {
    const _cellar = req.params._cellar;

    let startDate = new Date(String(req.query.startDate));
	let endDate  = new Date(String(req.query.endDate));
	endDate.setDate(endDate.getDate() + 1); // Sumamos un día para aplicar bien el filtro

    Purchase.find(
        {
            _cellar,
            date: {
                $gte: new Date(startDate.toDateString()),
                $lt: new Date(endDate.toDateString()),
            },
            state: 'APPLIED',
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

/* #region  GET / ID */
PURCHASE_ROUTER.get('/purchase/:id', mdAuth, (req: Request, res: Response) => {
    const ID = req.params.id;

    Purchase.findById(ID, (err, purchase) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar factura',
                errors: err,
            });
        }

        if (!purchase) {
            return res.status(400).json({
                ok: false,
                mensaje: 'La factura con el id' + ID + ' no existe',
                errors: {
                    message: 'No existe una factura con ese ID',
                },
            });
        }

        res.status(200).json({
            ok: true,
            purchase,
        });
    })
        .populate('detail._product', '')
        .populate({
            path: 'detail._product',
            populate: {
                path: '_brand',
            },
        })
});
/* #endregion */

/* #region  GET */
PURCHASE_ROUTER.get('/createds/:_cellar', mdAuth, (req: Request, res: Response) => {
    const _cellar = req.params._cellar;

    Purchase.find(
        {
            _cellar,
            state: 'CREATED',
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
PURCHASE_ROUTER.get('/updateds/:_cellar', mdAuth, (req: Request, res: Response) => {
    const _cellar = req.params._cellar;

    Purchase.find(
        {
            _cellar,
            state: 'UPDATED',
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

/* #region  STATES */
PURCHASE_ROUTER.put('/state/:id', mdAuth, (req: Request, res: Response) => {
    const ID = req.params.id;
    const BODY = req.body;

    Purchase.findById(ID, async (err, purchase) => {
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

        purchase.state = BODY.state;

        if (purchase.state === 'APPLIED') {
            await UPDATE_COSTS(BODY.detail);
        }

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
    });
});
/* #endregion */

/* #region  DETAIL */
PURCHASE_ROUTER.put('/detail/:id', mdAuth, (req: Request, res: Response) => {
    const ID = req.params.id;
    const BODY = req.body;

    Purchase.findById(ID, async (err, purchase) => {
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

        purchase.detail = BODY.detail;

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
    const BODY: IPurchase = req.body;

    // Si hay precios que cambiaron entonces el resultado será distinto de cero
    const CHANGED_PRICES = BODY.detail.filter(detail => (((Number(detail.cost) - Number(detail.lastCost)) / Number(detail.lastCost)) * 100) !== 0);
    // const CHANGED_PRICES = BODY.detail.reduce((sum: number, item: IPurchaseDetail) => sum + item.changedPrice, 0);
    const STATE = (CHANGED_PRICES.length > 0) ? 'CREATED' : 'UPDATED';

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
            state: STATE
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

const UPDATE_COSTS = async (detail: IPurchaseDetail[]): Promise<any> => {
    return Promise.all(
        detail.map(async (element: IPurchaseDetail) => {

            const PRODUCT = await Product.findOne(
                {
                    _id: element._product._id,
                    'presentations.name': element.presentation,
                },
                {
                    'presentations.$': 1,
                }
            ).exec();

            if (PRODUCT) {
                return Product.updateOne(
                    {
                        _id: element._product._id,
                        'presentations.name': element.presentation,
                    },
                    {
                        'presentations.$.cost': element.cost,
                    },
                ).exec();
            } else {
                return;
            }
        })
    );
};

export default PURCHASE_ROUTER;
