import { Router, Request, Response } from 'express';
import moment from 'moment-timezone';
import Server from '../classes/serve';
import { mdAuth } from '../middleware/auth'
import InternalOrder from '../models/internalOrder';
import { IInternalOrder } from '../models/internalOrder';
import Cellar from '../models/cellar';
import User from '../models/user';
import fs from 'fs';

// WebSockets Server
const SERVER = Server.instance;
const internalOrderRouter = Router();

/* #region  GET */
internalOrderRouter.get('/', mdAuth, (req: Request, res: Response) => {

    InternalOrder.find(
        {
            state: 'DESPACHO',
            deleted: false
        },
        ''
    )
        .populate('_cellar')
        .populate('_destination')
        .populate('_delivery')
        .sort({
            noOrder: -1
        })
        .exec((err: any, internalOrders: IInternalOrder) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando pedidos o traslados',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                internalOrders
            });
        });
});
/* #endregion */

/* #region  GET HISTORIAL */
internalOrderRouter.get('/:_cellar', mdAuth, (req: Request, res: Response) => {
    const _CELLAR = req.params._cellar;
    const TYPE = String(req.query.type);
    const ORIGIN = String(req.query.origin);

    let startDate = new Date(String(req.query.startDate));
	let endDate  = new Date(String(req.query.endDate));
	endDate.setDate(endDate.getDate() + 1); // Sumamos un día para aplicar bien el filtro

    if (ORIGIN === 'origen') {
        InternalOrder.find(
            {
                _cellar: _CELLAR,
                date: {
                    $gte: new Date(startDate.toDateString()),
                    $lt: new Date(endDate.toDateString()),
                },
                type: TYPE,
                deleted: false
            },
            ''
        )
            .populate('_cellar', '')
            .populate('_user', '')
            .populate('_delivery', '')
            .populate('_destination', '')
            .sort({
                noOrder: -1
            })
            .exec((err: any, internalOrders: IInternalOrder) => {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error listando pedidos o traslados',
                        errors: err
                    });
                }

                res.status(200).json({
                    ok: true,
                    internalOrders
                });
            });
    } else if (ORIGIN === 'destino') {
        InternalOrder.find(
            {
                _destination: _CELLAR,
                date: {
                    $gte: new Date(startDate.toDateString()),
                    $lt: new Date(endDate.toDateString()),
                },
                type: TYPE,
                deleted: false
            },
            ''
        )
            .populate('_cellar', '')
            .populate('_user', '')
            .populate('_delivery', '')
            .populate('_destination', '')
            .sort({
                noOrder: -1
            })
            .exec((err: any, internalOrders: IInternalOrder) => {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error listando pedidos o traslados',
                        errors: err
                    });
                }

                res.status(200).json({
                    ok: true,
                    internalOrders
                });
            });
    }
});
/* #endregion */

/* #region  GET */
internalOrderRouter.get('/activesCellar/:_cellar', mdAuth, (req: Request, res: Response) => {
    const _CELLAR = req.params._cellar;

    InternalOrder.find(
        {
            _cellar: _CELLAR,
            state: 'DESPACHO',
            deleted: false
        },
        ''
    )
        .populate('_cellar')
        .populate('_destination')
        .populate('_delivery')
        .sort({
            noOrder: -1
        })
        .exec((err: any, internalOrders: IInternalOrder) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando pedidos o traslados',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                internalOrders
            });
        });
});
/* #endregion */

/* #region  GET */
internalOrderRouter.get('/actives/:_delivery', mdAuth, (req: Request, res: Response) => {
    const _delivery = req.params._delivery;

    InternalOrder.find(
        {
            _delivery,
            state: 'DESPACHO',
            deleted: false
        },
        ''
    )
        .populate('_cellar')
        .populate('_destination')
        .sort({
            noOrder: -1
        })
        .exec((err: any, internalOrders: IInternalOrder) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando pedidos o traslados',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                internalOrders
            });
        });
});
/* #endregion */

/* #region  GET */
internalOrderRouter.get('/outgoing/:_destination', mdAuth, (req: Request, res: Response) => {
    const _destination = req.params._destination;
    const type = String(req.query.type);

    InternalOrder.find(
        {
            _destination,
            type,
            state: {
                $ne: 'ENTREGA'
            },
            deleted: false
        },
        ''
    )
        .populate('_user', '')
        .populate('_delivery', '')
        .populate('_cellar', '')
        .sort({
            noOrder: -1
        })
        .exec((err: any, internalOrders: IInternalOrder) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando pedidos o traslados',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                internalOrders
            });
        });
});
/* #endregion */

/* #region  GET */
internalOrderRouter.get('/incoming/:_cellar', mdAuth, (req: Request, res: Response) => {
    const _cellar = req.params._cellar;
    const type = String(req.query.type);

    InternalOrder.find(
        {
            _cellar,
            type,
            state: {
                $ne: 'ENTREGA'
            },
            deleted: false
        },
        ''
    )
        .populate('_destination', '')
        .populate('_user', '')
        .populate('_delivery', '')
        .sort({
            noOrder: -1
        })
        .exec((err: any, internalOrders: IInternalOrder) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error listando pedidos o traslados',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                internalOrders
            });
        });
});
/* #endregion */

/* #region  GET / ID */
internalOrderRouter.get('/order/:id', mdAuth, (req: Request, res: Response) => {
    const id = req.params.id;

    InternalOrder.findById(id, (err, order) => {
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
/* #endregion */

/* #region  PUT */
internalOrderRouter.put('/:id', mdAuth, (req: Request, res: Response) => {
    const id = req.params.id;
    const body = req.body;

    InternalOrder.findById(id, (err, internalOrder) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar pedido o traslado',
                errors: err
            });
        }

        if (!internalOrder) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El pedido o traslado con el id' + id + ' no existe',
                errors: {
                    message: 'No existe un pedido o traslado con ese ID'
                }
            });
        }

        internalOrder._destination = body._destination;
        internalOrder._user = body._user;
        internalOrder.noOrder = body.noOrder;
        internalOrder.details = body.details;

        internalOrder.save((err, internalOrder) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar pedido o traslado',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                internalOrder
            });
        });

    });
});
/* #endregion */

/* #region  PUT */
internalOrderRouter.put('/state/:id', mdAuth, (req: Request, res: Response) => {
    const id = req.params.id;
    const body = req.body;

    InternalOrder.findById(id, (err, internalOrder) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar pedido o traslado',
                errors: err
            });
        }

        if (!internalOrder) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El pedido o traslado con el id' + id + ' no existe',
                errors: {
                    message: 'No existe un pedido o traslado con ese ID'
                }
            });
        }

        internalOrder.state = body.state;
        if (body.state === 'CONFIRMACION') {
            internalOrder.timeInit = moment().tz("America/Guatemala").format();
        }
        if (body.state === 'DESPACHO') {
            internalOrder.timeDispatch = moment().tz("America/Guatemala").format();
            internalOrder._delivery = body._delivery;
        }
        if (body.state === 'ENTREGA') {
            internalOrder.timeDelivery = moment().tz("America/Guatemala").format();
        }

        internalOrder.save((err, internalOrder) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar pedido o traslado',
                    errors: err
                });
            }

            Cellar.populate(internalOrder, { path: '_cellar' }, (err, result: IInternalOrder) => {
                Cellar.populate(result, { path: '_destination' }, (err, result: IInternalOrder) => {
                    User.populate(result, { path: '_user' }, (err, result: IInternalOrder) => {
                        SERVER.io.in(result._cellar._id).emit('updateIncoming', result);
                        SERVER.io.in(result._destination._id).emit('updateOutgoing', result);
                    });
                });
            });

            res.status(200).json({
                ok: true,
                internalOrder
            });
        });
    });
});
/* #endregion */

/* #region  DELETE */
internalOrderRouter.put('/delete/:id', mdAuth, (req: Request, res: Response) => {
    const id = req.params.id;
    const body = req.body;

    InternalOrder.findById(id, (err, internalOrder) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar pedido o traslado',
                errors: err
            });
        }

        if (!internalOrder) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El pedido o traslado con el id' + id + ' no existe',
                errors: {
                    message: 'No existe un pedido o traslado con ese ID'
                }
            });
        }

        // internalOrder._userDeleted = body._userDeleted;
        // internalOrder.textDeleted = body.textDeleted;
        internalOrder.deleted = true;

        internalOrder.save((err, internalOrder) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al borrar pedido o traslado',
                    errors: err
                });
            }

            // Si existe un archivo almacenado anteriormente
            const oldPath = './uploads/internalOrders/' + internalOrder.file;

            if (fs.existsSync(oldPath)) {
                // Borramos el archivo antiguo
                fs.unlink(oldPath, err => {
                    if (err) {
                        return res.status(500).json({
                            ok: false,
                            mensaje: 'Error al eliminar archivo antiguo',
                            errors: err
                        });
                    }

                    res.status(200).json({
                        ok: true,
                        internalOrder
                    });
                });
            }
        });
    });
});
/* #endregion */

/* #region  POST cellar */
internalOrderRouter.post('/', mdAuth, (req: Request, res: Response) => {
    const BODY = req.body;

    const newInternalOrder = new InternalOrder({
        _cellar: BODY._cellar,
        _user: BODY._user,
        _destination: BODY._destination,
        noOrder: BODY.noOrder,
        date: moment().tz("America/Guatemala").format(),
        details: BODY.details,
        type: BODY.type,
        state: BODY.state,
    });

    newInternalOrder
        .save()
        .then((internalOrder) => {

            if (!BODY.file) {
                if (internalOrder.state === 'ENVIO') {
                    SERVER.io.in(internalOrder._cellar).emit('newInternalOrder', internalOrder);
                }
                Cellar.populate(internalOrder, { path: '_cellar' }, (err, result: IInternalOrder) => {
                    Cellar.populate(result, { path: '_destination' }, (err, result: IInternalOrder) => {
                        User.populate(result, { path: '_user' }, (err, result: IInternalOrder) => {
                            SERVER.io.in(result._cellar._id).emit('updateIncoming', result);
                            SERVER.io.in(result._destination._id).emit('updateOutgoing', result);
                        });
                    });
                });
            }

            res.status(200).json({
                ok: true,
                internalOrder,
            });
        })
        .catch((err) => {
            res.status(400).json({
                ok: false,
                mensaje: 'Error al crear pedido o traslado',
                errors: err,
            });
        });
});
/* #endregion */

export default internalOrderRouter;
