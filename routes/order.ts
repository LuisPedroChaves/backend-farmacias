import { Router, Request, Response } from 'express';
// import mongoose from 'mongoose';
import moment from 'moment-timezone';
import { mdAuth } from '../middleware/auth'
import Order from '../models/order';
import Customer from '../models/customer';

import { IOrder } from '../models/order';

const ORDER_ROUTER = Router();

/* #region  GETS */
ORDER_ROUTER.get('/adminRoutes/', mdAuth, (req: Request, res: Response) => {

    Order.find(
        {
            state: 'DESPACHO',
            deleted: false
        },
        ''
    )
        .populate('_delivery')
        .sort({
            noOrder: -1
        })
        .exec((err: any, orders: IOrder) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando ordenes',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                orders
            });
        });
});

ORDER_ROUTER.get('/dispatches/:_cellar', mdAuth, (req: Request, res: Response) => {
    const _cellar = req.params._cellar;

    Order.find(
        {
            _cellar,
            state: 'ORDEN',
            deleted: false
        },
        ''
    )
        .sort({
            noOrder: -1
        })
        .exec((err: any, dispatches: IOrder) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando ordenes',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                dispatches
            });
        });
});

ORDER_ROUTER.get('/routes/:_cellar', mdAuth, (req: Request, res: Response) => {
    const _cellar = req.params._cellar;

    Order.find(
        {
            _cellar,
            state: 'DESPACHO',
            deleted: false
        },
        ''
    )
        .populate('_delivery')
        .sort({
            noOrder: -1
        })
        .exec((err: any, orders: IOrder) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando ordenes',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                orders
            });
        });
});

ORDER_ROUTER.get('/order/:id', mdAuth, (req: Request, res: Response) => {
    const id = req.params.id;

    Order.findById(id, (err, order) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar orden',
                errors: err,
            });
        }

        if (!order) {
            return res.status(400).json({
                ok: false,
                mensaje: 'La orden con el id' + id + ' no existe',
                errors: {
                    message: 'No existe una orden con ese ID',
                },
            });
        }

        res.status(200).json({
            ok: true,
            order,
        });
    })
        .populate('_user', '')
        .populate('_userDeleted', '')
        .populate('_delivery', '');
});

ORDER_ROUTER.get('/:_cellar/:_delivery', mdAuth, (req: Request, res: Response) => {
    const _CELLAR = req.params._cellar;
    const _DELIVERY = req.params._delivery;

    let startDate = new Date(String(req.query.startDate));
	let endDate  = new Date(String(req.query.endDate));
	endDate.setDate(endDate.getDate() + 1); // Sumamos un día para aplicar bien el filtro

    const FILTER: any =
    {
        date: {
            $gte: new Date(startDate.toDateString()),
            $lt: new Date(endDate.toDateString()),
        },
        deleted: false
    };

    if (_CELLAR !== 'all') {
        FILTER._cellar = _CELLAR;
    }

    if (_DELIVERY !== 'all') {
        FILTER._delivery = _DELIVERY;
    }

    Order.find(
        FILTER
    )
        .populate('_cellar', '')
        .populate('_user', '')
        .populate('_customer', '')
        .sort({
            noOrder: -1
        })
        .exec((err: any, orders: IOrder) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando ordenes',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                orders
            });
        });
});
/* #endregion */

/* #region  PUT */
ORDER_ROUTER.put('/:id', mdAuth, (req: Request, res: Response) => {
    const id = req.params.id;
    const body = req.body;

    Order.findById(id, (err, order) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar orden',
                errors: err
            });
        }

        if (!order) {
            return res.status(400).json({
                ok: false,
                mensaje: 'La orden con el id' + id + ' no existe',
                errors: {
                    message: 'No existe una orden con ese ID'
                }
            });
        }

        order._cellar = body._cellar;
        order._user = body._user;
        order.nit = body.nit;
        order.name = body.name;
        order.phone = body.phone;
        order.address = body.address;
        order.town = body.town;
        order.department = body.department;
        order.details = body.details;
        order.payment = body.payment;
        order.total = body.total;

        order.save((err, order) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar orden',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                order
            });
        });
    });
});
/* #endregion */

/* #region  PUT */
ORDER_ROUTER.put('/state/:id', mdAuth, (req: Request, res: Response) => {
    const id = req.params.id;
    const body = req.body;

    Order.findById(id, (err, order) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar orden',
                errors: err
            });
        }

        if (!order) {
            return res.status(400).json({
                ok: false,
                mensaje: 'La orden con el id' + id + ' no existe',
                errors: {
                    message: 'No existe una orden con ese ID'
                }
            });
        }

        order.noBill = body.noBill;
        order.state = body.state;
        if (body.state === 'DESPACHO') {
            order.timeDispatch = moment().tz("America/Guatemala").format();
        }
        if (body.state === 'ENTREGA' || body.state === 'DEVOLUCION') {
            order.timeDelivery = moment().tz("America/Guatemala").format();
            order.textReturned = body.textReturned;
        }

        order.save((err, order) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar order',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                order
            });
        });
    });
});
/* #endregion */

/* #region  DELETE */
ORDER_ROUTER.put('/delete/:id', mdAuth, (req: Request, res: Response) => {
    const id = req.params.id;
    const body = req.body;

    Order.findById(id, (err, order) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar orden',
                errors: err
            });
        }

        if (!order) {
            return res.status(400).json({
                ok: false,
                mensaje: 'La orden con el id' + id + ' no existe',
                errors: {
                    message: 'No existe una orden con ese ID'
                }
            });
        }

        order._userDeleted = body._userDeleted;
        order.textDeleted = body.textDeleted;
        order.deleted = true;

        order.save((err, order) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al borrar orden',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                order
            });
        });
    });
});
/* #endregion */

/* #region  POST cellar */
ORDER_ROUTER.post('/', mdAuth, async (req: Request, res: Response) => {
    const BODY: IOrder = req.body;

    try {
        if (BODY._customer._id) {
            if (BODY.nit) {
                BODY.nit = BODY.nit.replace(/\s/g, '');
                BODY.nit = BODY.nit.replace(/-/g, '').toUpperCase();
            }

            BODY._customer.name = BODY.name;
            BODY._customer.nit = BODY.nit;
            BODY._customer.phone = BODY.phone;

            await Customer.updateOne(
                {
                    _id: BODY._customer._id,
                },
                BODY._customer
            ).exec();
        }else {
            const customer = new Customer({
                name: BODY.name,
                nit: BODY.nit,
                phone: BODY.phone,
                address: BODY.address,
                town: BODY.town,
                department: BODY.department,
            });

            await customer
                .save()
                .then((NewCustomer) => {
                    BODY._customer = NewCustomer;
                })
                .catch((err) => {
                    res.status(400).json({
                        ok: false,
                        mensaje: 'Error al crear cliente',
                        errors: err,
                    });
                });
        }

        Order.findOne(
            {
                _cellar: BODY._cellar,
                deleted: false
            },
            'noOrder',
            {
                sort: {
                    noOrder: -1
                }
            },
            function (err, order) {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error al buscar correlativo',
                        errors: err,
                    });
                }

                // Definiciones para la factura
                let correlative = 0;
                if (order) {
                    correlative = Number(order.noOrder) + 1;
                }

                const newOrder = new Order({
                    _cellar: BODY._cellar,
                    _user: BODY._user,
                    _customer: BODY._customer,
                    noOrder: correlative,
                    noBill: BODY.noBill,
                    name: BODY.name,
                    nit: BODY.nit,
                    phone: BODY.phone,
                    address: BODY.address,
                    town: BODY.town,
                    department: BODY.department,
                    details: BODY.details,
                    payment: BODY.payment,
                    sellerCode: BODY.sellerCode,
                    total: BODY.total,
                    date: moment().tz("America/Guatemala").format(),
                    timeOrder: BODY.timeOrder
                });

                newOrder
                    .save()
                    .then((order) => {
                        res.status(200).json({
                            ok: true,
                            order,
                        });
                    })
                    .catch((err) => {
                        res.status(400).json({
                            ok: false,
                            mensaje: 'Error al crear orden',
                            errors: err,
                        });
                    });
            }
        );
    } catch (err) {
        // ERROR GLOBAL
        console.log("🚀 ~ file: order.ts ~ line 1248 ~ orderRouter.post ~ err", err)
    }
});
/* #endregion */

export default ORDER_ROUTER;
