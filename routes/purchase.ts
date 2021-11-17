import { Router, Request, Response } from 'express';
import { mdAuth } from '../middleware/auth'
import moment from 'moment-timezone';

import Server from '../classes/serve';
import Purchase from '../models/purchase';
import Provider from '../models/provider';
import Product from '../models/product';
import User from '../models/user';
import { IPurchase, IPurchaseDetail } from '../models/purchase';

// WebSockets Server
const SERVER = Server.instance;
const PURCHASE_ROUTER = Router();

/* #region  GET'S */
PURCHASE_ROUTER.get('/:_cellar', mdAuth, (req: Request, res: Response) => {
    const _cellar = req.params._cellar;

    let startDate = new Date(String(req.query.startDate));
    let endDate = new Date(String(req.query.endDate));
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
        .populate('_provider')
        .populate('_user')
        .populate('detail._product', '')
        .populate({
            path: 'detail._product',
            populate: {
                path: '_brand',
            },
        })
});

PURCHASE_ROUTER.get('/alls/:_cellar', mdAuth, (req: Request, res: Response) => {
    const _cellar = req.params._cellar;

    Purchase.find(
        {
            _cellar,
            $or: [
                {state: 'REQUISITION'},
                {state: 'CREATED'},
                {state: 'UPDATED'},
            ],
            deleted: false
        }
    )
        .sort({
            date: -1
        })
        .populate('_lastUpdate', '')
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

PURCHASE_ROUTER.get('/requisitions/:_cellar', mdAuth, (req: Request, res: Response) => {
    const _cellar = req.params._cellar;

    Purchase.find(
        {
            _cellar,
            state: 'REQUISITION',
            deleted: false
        }
    )
        .sort({
            date: -1
        })
        .populate('_user', '')
        .populate('_provider', '')
        .populate('detail._product', '')
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
        .populate('_lastUpdate', '')
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
            created: {
                $gte: new Date(año + ',' + mes),
                $lt: new Date(año2 + ',' + mes2),
            },
            deleted: true
        }
    )
        .sort({
            created: -1
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

/* #region  PUTS */
PURCHASE_ROUTER.put('/state/:id', mdAuth, (req: Request, res: Response) => {
    const ID = req.params.id;
    const BODY: IPurchase = req.body;

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

        if (purchase.state === 'REQUISITION') {
            purchase.noBill = BODY.noBill;
            purchase.date = BODY.date;
            purchase.details = BODY.details;
            purchase.detail = BODY.detail;
            purchase.total = BODY.total;
            purchase._lastUpdate = BODY._lastUpdate;
            // Funcion para consultar si los costos cambiaron con respecto a la ultima compra
            const RESULT = await CHANGED_PRICES(BODY.detail);
            if (RESULT.includes(true)) {
                // Si hay precios distintos entonces pasa al listado de "Actualizar precios"
                purchase.state = 'CREATED';
            } else {
                // Si no hay precios distintos entonces pasa al listado de "Ingresos pendientes"
                purchase.state = 'UPDATED';
            }
        }

        if (purchase.state === 'APPLIED') {
            await UPDATE_COSTS(BODY.detail);
        }

        purchase.save((err, purchase) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar compra',
                    errors: err
                });
            }

            Provider.populate(purchase, { path: '_provider' }, (err, result: IPurchase) => {
                User.populate(result, { path: '_user' }, (err, result: IPurchase) => {
                    Product.populate(result, { path: 'detail._product' }, (err, result: IPurchase) => {
                        SERVER.io.in(result._cellar).emit('newRequisition', result);
                    });
                });
            });

            res.status(200).json({
                ok: true,
                purchase
            });
        });
    });
});

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

        BODY.detail = await SEARCH_PRESENTATIONS(BODY.detail);

        Purchase.findOne(
            {
                _cellar: BODY._cellar,
                deleted: false
            },
            'requisition',
            {
                sort: {
                    requisition: -1
                }
            },
            function (err, purchase) {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error al buscar correlativo',
                        errors: err,
                    });
                }

                // Definiciones para la factura
                let correlative = 1;
                if (purchase) {
                    correlative = Number(purchase.requisition) + 1;
                }

                const newPurchase = new Purchase({
                    _cellar: BODY._cellar,
                    _user: BODY._user,
                    _provider: _provider,
                    requisition: correlative,
                    detail: BODY.detail,
                    payment: BODY.payment,
                    created: moment().tz("America/Guatemala").format(),
                    _lastUpdate: BODY._user
                });

                newPurchase
                    .save()
                    .then((purchase) => {
                        Provider.populate(purchase, { path: '_provider' }, (err, result: IPurchase) => {
                            User.populate(result, { path: '_user' }, (err, result: IPurchase) => {
                                Product.populate(result, { path: 'detail._product' }, (err, result: IPurchase) => {
                                    SERVER.io.in(result._cellar).emit('newRequisition', result);
                                });
                            });
                        });
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
});
/* #endregion */

/* #region  Functions */
const CHANGED_PRICES = async (detail: IPurchaseDetail[]): Promise<boolean[]> => {
    return Promise.all(
        detail.map(async (detail: IPurchaseDetail) => {

            const PRODUCT = await Product.findOne(
                {
                    _id: detail._product._id,
                    'presentations.name': detail.presentation.name,
                },
                {
                    'presentations.$': 1,
                }
            ).exec();

            if (PRODUCT) {
                const LAST_COST = PRODUCT.presentations[0].cost;
                // Formula para encontrar la diferencia entre el nuevo costo y el ultimo costo ingresado
                // (NUEVO COSTO - ULTIMO COSTO) / ULTIMO COSTO * 100
                // Si es igual a CERO entonces el costo no cambio
                if ((((Number(detail.cost) - Number(LAST_COST)) / Number(LAST_COST)) * 100) === 0) {
                    return false;

                } else {
                    return true;
                }
            } else {
                return false;
            }
        })
    );
};

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

const SEARCH_PRESENTATIONS = async (detail: IPurchaseDetail[]): Promise<IPurchaseDetail[]> => {
    return Promise.all(
        detail.map((element: any) => {
            element.presentation = {
                name: element._product.presentations.name,
                quantity: element._product.presentations.quantity
            };
            return element;
        })
    );
}
/* #endregion */

export default PURCHASE_ROUTER;
